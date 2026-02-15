'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, FileStack, Loader2, XCircle } from 'lucide-react';
import { AuthGuard } from '@/components/auth-guard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { useCenterOpposition } from '../use-center-opposition';

type UploadStatus = 'pending' | 'processing' | 'completed' | 'failed';

type UploadRow = {
  id: string;
  file_name: string;
  status: UploadStatus;
  progress: number;
  error_message: string | null;
  created_at: string;
};

type ChunkRow = {
  id: string;
  content_id: string;
  tema: string | null;
  subtema: string | null;
  chunk_text: string;
  tags: string[] | null;
  created_at: string;
};

type ProcessedContentRow = {
  id: string;
  upload_id: string;
};

const STATUS_LABEL: Record<UploadStatus, string> = {
  pending: 'Pendiente',
  processing: 'Procesando',
  completed: 'Completado',
  failed: 'Fallido',
};

function statusClass(status: UploadStatus) {
  if (status === 'completed') return 'bg-emerald-100 text-emerald-700';
  if (status === 'processing') return 'bg-blue-100 text-blue-700';
  if (status === 'failed') return 'bg-rose-100 text-rose-700';
  return 'bg-amber-100 text-amber-700';
}

export default function OppositionContentPage({
  params,
}: {
  params: Promise<{ slug: string; oppositionSlug: string }>;
}) {
  const { slug, oppositionSlug } = use(params);
  const { organization, opposition, isLoading: contextLoading, error: contextError } =
    useCenterOpposition(oppositionSlug);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploads, setUploads] = useState<UploadRow[]>([]);
  const [chunks, setChunks] = useState<ChunkRow[]>([]);
  const [chunkCount, setChunkCount] = useState(0);
  const [uploadIdByContentId, setUploadIdByContentId] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!organization || !opposition) return;
    const currentOrganization = organization;
    const currentOpposition = opposition;
    const supabase = createClient();

    async function load() {
      setLoading(true);
      setError(null);

      const [uploadsRes, chunksRes, chunkCountRes] = await Promise.all([
        supabase
          .from('content_uploads')
          .select('id, file_name, status, progress, error_message, created_at')
          .eq('center_id', currentOrganization.id)
          .eq('oposicion_id', currentOpposition.id)
          .order('created_at', { ascending: false })
          .limit(30),
        supabase
          .from('knowledge_chunks')
          .select('id, content_id, tema, subtema, chunk_text, tags, created_at')
          .eq('oposicion_id', currentOpposition.id)
          .order('created_at', { ascending: false })
          .limit(60),
        supabase
          .from('knowledge_chunks')
          .select('id', { head: true, count: 'exact' })
          .eq('oposicion_id', currentOpposition.id),
      ]);

      if (uploadsRes.error) {
        throw new Error(uploadsRes.error.message);
      }
      if (chunksRes.error) {
        throw new Error(chunksRes.error.message);
      }
      if (chunkCountRes.error) {
        throw new Error(chunkCountRes.error.message);
      }

      const uploadRows = (uploadsRes.data ?? []) as UploadRow[];
      const chunkRows = (chunksRes.data ?? []) as ChunkRow[];
      const contentIds = [...new Set(chunkRows.map((chunk) => chunk.content_id))];

      const mapping: Record<string, string> = {};
      if (contentIds.length > 0) {
        const { data: processedRows, error: processedError } = await supabase
          .from('processed_content')
          .select('id, upload_id')
          .in('id', contentIds);

        if (processedError) {
          throw new Error(processedError.message);
        }

        for (const row of (processedRows ?? []) as ProcessedContentRow[]) {
          mapping[row.id] = row.upload_id;
        }
      }

      setUploads(uploadRows);
      setChunks(chunkRows);
      setChunkCount(chunkCountRes.count ?? chunkRows.length);
      setUploadIdByContentId(mapping);
      setLoading(false);
    }

    load().catch((loadError) => {
      setError((loadError as Error).message);
      setLoading(false);
    });
  }, [opposition, organization]);

  const chunkCountByUploadId = useMemo(() => {
    const counts = new Map<string, number>();
    for (const chunk of chunks) {
      const uploadId = uploadIdByContentId[chunk.content_id];
      if (!uploadId) continue;
      counts.set(uploadId, (counts.get(uploadId) ?? 0) + 1);
    }
    return counts;
  }, [chunks, uploadIdByContentId]);

  const failedUploads = uploads.filter((upload) => upload.status === 'failed').length;
  const completedUploads = uploads.filter((upload) => upload.status === 'completed').length;

  return (
    <AuthGuard
      resource="kb_chunks"
      action="read"
      fallbackPath={`/centro/${slug}/oposiciones/${oppositionSlug}`}
    >
      {contextLoading || loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#1B3A5C]" />
        </div>
      ) : contextError ? (
        <p className="text-sm text-slate-500">{contextError}</p>
      ) : (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-[#1B3A5C]">Contenido KB y trazabilidad</h2>
            <p className="text-sm text-slate-500">
              Revisión de ingestas y chunks indexados para {opposition?.name}.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardDescription>Uploads</CardDescription>
                <CardTitle className="text-3xl">{uploads.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardDescription>Chunks indexados</CardDescription>
                <CardTitle className="text-3xl">{chunkCount}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardDescription>Ingestas completadas</CardDescription>
                <CardTitle className="text-3xl text-emerald-700">{completedUploads}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardDescription>Ingestas con error</CardDescription>
                <CardTitle className="text-3xl text-rose-700">{failedUploads}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {error && (
            <Card className="border-rose-200 bg-rose-50">
              <CardContent className="flex items-center gap-2 py-3 text-sm text-rose-700">
                <AlertCircle className="h-4 w-4" />
                {error}
              </CardContent>
            </Card>
          )}

          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Trazabilidad por upload</CardTitle>
              <CardDescription>
                Estado del pipeline y chunks vinculados por archivo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {uploads.length === 0 ? (
                <p className="text-sm text-slate-500">No hay uploads para esta oposición.</p>
              ) : (
                <div className="space-y-2">
                  {uploads.map((upload) => (
                    <div key={upload.id} className="rounded-md border border-slate-200 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium text-slate-900">{upload.file_name}</p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(upload.status)}`}
                        >
                          {STATUS_LABEL[upload.status]}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span>
                          Chunks: <strong>{chunkCountByUploadId.get(upload.id) ?? 0}</strong>
                        </span>
                        <span>Progreso: {upload.progress}%</span>
                        <span>{new Date(upload.created_at).toLocaleString('es-ES')}</span>
                      </div>
                      {upload.error_message && (
                        <p className="mt-2 text-xs text-rose-600">{upload.error_message}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Chunks recientes</CardTitle>
              <CardDescription>
                Vista rápida del contenido vectorizado con su fuente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chunks.length === 0 ? (
                <p className="text-sm text-slate-500">Todavía no hay chunks procesados.</p>
              ) : (
                <div className="space-y-3">
                  {chunks.slice(0, 20).map((chunk) => {
                    const uploadId = uploadIdByContentId[chunk.content_id];
                    const upload = uploads.find((row) => row.id === uploadId);
                    return (
                      <div key={chunk.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-700">
                            {chunk.tema ?? 'Tema general'}
                          </span>
                          {chunk.subtema ? (
                            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-700">
                              {chunk.subtema}
                            </span>
                          ) : null}
                          {upload?.file_name ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs text-slate-600">
                              <FileStack className="h-3 w-3" />
                              {upload.file_name}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 line-clamp-3 text-sm text-slate-700">{chunk.chunk_text}</p>
                        {chunk.tags?.length ? (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {chunk.tags.map((tag) => (
                              <span
                                key={`${chunk.id}-${tag}`}
                                className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Flujo correcto
            </span>
            <span className="inline-flex items-center gap-1">
              <XCircle className="h-3.5 w-3.5 text-rose-600" />
              Requiere revisión
            </span>
          </div>
        </div>
      )}
    </AuthGuard>
  );
}
