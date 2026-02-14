import { createClient } from '@supabase/supabase-js';

export function createServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Supabase service credentials no configuradas');
  }

  return createClient(url, key);
}

export async function updateUploadState(args: {
  supabase: ReturnType<typeof createServiceSupabase>;
  uploadId: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  errorMessage?: string | null;
  metadataPatch?: Record<string, unknown>;
}) {
  const updates: Record<string, unknown> = {};

  if (args.status) updates.status = args.status;
  if (typeof args.progress === 'number') updates.progress = Math.max(0, Math.min(100, Math.round(args.progress)));
  if (typeof args.errorMessage !== 'undefined') updates.error_message = args.errorMessage;

  if (args.metadataPatch) {
    const { data: current } = await args.supabase
      .from('content_uploads')
      .select('metadata')
      .eq('id', args.uploadId)
      .single();

    updates.metadata = {
      ...(current?.metadata ?? {}),
      ...args.metadataPatch,
    };
  }

  const { error } = await args.supabase
    .from('content_uploads')
    .update(updates)
    .eq('id', args.uploadId);

  if (error) {
    throw new Error(`No se pudo actualizar estado de upload: ${error.message}`);
  }
}

export async function getUploadFileBytes(args: {
  supabase: ReturnType<typeof createServiceSupabase>;
  storagePath: string;
}) {
  const signed = await args.supabase.storage
    .from('content-uploads')
    .createSignedUrl(args.storagePath, 60 * 60);

  if (signed.error || !signed.data?.signedUrl) {
    throw new Error(signed.error?.message ?? 'No se pudo crear URL firmada para archivo');
  }

  const response = await fetch(signed.data.signedUrl);
  if (!response.ok) {
    throw new Error(`No se pudo descargar archivo: ${response.status}`);
  }

  return {
    signedUrl: signed.data.signedUrl,
    bytes: Buffer.from(await response.arrayBuffer()),
  };
}
