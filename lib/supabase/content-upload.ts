import { createClient } from '@/lib/supabase/client';

const BUCKET = 'content-uploads';

function encodePath(path: string) {
  return path
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');
}

export async function uploadContentWithProgress(args: {
  file: File;
  path: string;
  onProgress?: (percent: number) => void;
}) {
  const supabase = createClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    throw new Error('No hay sesión activa para subir archivos');
  }

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!baseUrl || !anonKey) {
    throw new Error('Supabase no configurado en cliente');
  }

  const endpoint = `${baseUrl}/storage/v1/object/${BUCKET}/${encodePath(args.path)}`;

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', endpoint, true);
    xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
    xhr.setRequestHeader('apikey', anonKey);
    xhr.setRequestHeader('x-upsert', 'false');
    xhr.setRequestHeader('content-type', args.file.type || 'application/octet-stream');

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const percent = Math.round((event.loaded / event.total) * 100);
      args.onProgress?.(percent);
    };

    xhr.onerror = () => {
      reject(new Error('Fallo de red al subir archivo a Supabase Storage'));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        args.onProgress?.(100);
        resolve();
        return;
      }

      let errorMessage = `Storage upload falló con estado ${xhr.status}`;
      try {
        const parsed = JSON.parse(xhr.responseText) as { error?: string; message?: string };
        errorMessage = parsed.error || parsed.message || errorMessage;
      } catch {
        if (xhr.responseText) errorMessage = xhr.responseText;
      }

      reject(new Error(errorMessage));
    };

    xhr.send(args.file);
  });

  return {
    path: args.path,
    bucket: BUCKET,
  };
}
