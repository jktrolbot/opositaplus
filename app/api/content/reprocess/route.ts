import { NextResponse } from 'next/server';
import { tasks } from '@trigger.dev/sdk/v3';
import { createClient } from '@/lib/supabase/server';
import type { processContentUpload } from '@/trigger/process-content-upload';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { uploadId?: string; force?: boolean };
    const uploadId = body.uploadId;

    if (!uploadId) {
      return NextResponse.json({ error: 'uploadId es obligatorio' }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { data: upload, error: uploadError } = await supabase
      .from('content_uploads')
      .select('id, status')
      .eq('id', uploadId)
      .single();

    if (uploadError || !upload) {
      return NextResponse.json({ error: 'Upload no encontrado o sin permisos' }, { status: 404 });
    }

    if (upload.status === 'processing' && !body.force) {
      return NextResponse.json({
        ok: true,
        uploadId,
        skipped: true,
        reason: 'El archivo ya está en procesamiento',
      });
    }

    const { error: updateError } = await supabase
      .from('content_uploads')
      .update({
        status: 'pending',
        progress: 0,
        error_message: null,
      })
      .eq('id', uploadId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    const handle = await tasks.trigger<typeof processContentUpload>('processContentUpload', {
      uploadId,
      force: body.force ?? false,
    });

    return NextResponse.json({ ok: true, uploadId, runId: handle.id });
  } catch (error) {
    console.error('POST /api/content/reprocess error', error);
    return NextResponse.json({ error: 'No se pudo iniciar el reprocesado' }, { status: 500 });
  }
}
