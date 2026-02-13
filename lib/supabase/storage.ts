import { createClient } from '@/lib/supabase/client';

const BUCKET = 'resources';

export async function uploadResource(file: File, path: string) {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteStorageResource(path: string) {
  const supabase = createClient();
  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([path]);

  if (error) throw new Error(error.message);
  return { success: true };
}

export function getResourceUrl(path: string) {
  const supabase = createClient();
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
