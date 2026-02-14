'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FileText, Loader2, UploadCloud } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ACCEPTED_UPLOAD_EXTENSIONS, detectFileType, isAcceptedUpload } from '@/lib/knowledge/mime';
import { uploadContentWithProgress } from '@/lib/supabase/content-upload';

type UploadStatus = 'pending' | 'processing' | 'completed' | 'failed';

type UploadRow = {
  id: string;
  file_name: string;
  file_type: string;
  mime_type: string;
  status: UploadStatus;
  progress: number;
  error_message: string | null;
  created_at: string;
  organizations?: { name?: string | null } | null;
  oppositions?: { name?: string | null } | null;
};

type QueueItem = {
  id: string;
  fileName: string;
  progress: number;
  status: 'waiting' | 'uploading' | 'queued' | 'error';
  error?: string;
};

type PreviewState = {
  rawText: string;
  chunks: number;
  questions: number;
  flashcards: number;
  summaries: number;
};

function sanitizeFileName(fileName: string) {
  return fileName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function statusBadgeClass(status: UploadStatus) {
  if (status === 'completed') return 'bg-emerald-100 text-emerald-700';
  if (status === 'processing') return 'bg-blue-100 text-blue-700';
  if (status === 'failed') return 'bg-rose-100 text-rose-700';
  return 'bg-amber-100 text-amber-700';
}

function statusLabel(status: UploadStatus) {
  if (status === 'completed') return 'Completado';
  if (status === 'processing') return 'Procesando';
  if (status === 'failed') return 'Fallido';
  return 'Pendiente';
}

export default function ContentUploadPage() {
  const [centers, setCenters] = useState<Array<{ id: string; name: string }>>([]);
  const [oposiciones, setOposiciones] = useState<Array<{ id: string; name: string }>>([]);
  const [centerId, setCenterId] = useState('');
  const [oposicionId, setOposicionId] = useState('');
  const [uploads, setUploads] = useState<UploadRow[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedUploadId, setSelectedUploadId] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewState | null>(null);

  const acceptedString = useMemo(() => ACCEPTED_UPLOAD_EXTENSIONS.join(','), []);

  const refreshUploads = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('content_uploads')
      .select('id, file_name, file_type, mime_type, status, progress, error_message, created_at, organizations(name), oppositions(name)')
      .order('created_at', { ascending: false })
      .limit(80);

    setUploads((data ?? []) as unknown as UploadRow[]);
  }, []);

  useEffect(() => {
    const supabase = createClient();

    Promise.all([
      supabase.from('organizations').select('id, name').order('name'),
      supabase.from('oppositions').select('id, name').order('name'),
      supabase
        .from('content_uploads')
        .select('id, file_name, file_type, mime_type, status, progress, error_message, created_at, organizations(name), oppositions(name)')
        .order('created_at', { ascending: false })
        .limit(80),
    ])
      .then(([centersRes, oposicionesRes, uploadsRes]) => {
        setCenters(centersRes.data ?? []);
        setOposiciones(oposicionesRes.data ?? []);
        setUploads((uploadsRes.data ?? []) as unknown as UploadRow[]);

        setCenterId((current) => current || centersRes.data?.[0]?.id || '');
        setOposicionId((current) => current || oposicionesRes.data?.[0]?.id || '');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshUploads().catch(() => {});
    }, 10000);

    return () => clearInterval(interval);
  }, [refreshUploads]);

  useEffect(() => {
    if (!selectedUploadId) {
      setPreview(null);
      return;
    }

    const supabase = createClient();

    async function loadPreview() {
      const { data: processedRows } = await supabase
        .from('processed_content')
        .select('id, raw_text, chunks, metadata')
        .eq('upload_id', selectedUploadId)
        .order('created_at', { ascending: false })
        .limit(1);

      const processed = processedRows?.[0];
      if (!processed) {
        setPreview(null);
        return;
      }

      const { data: chunkRows } = await supabase
        .from('knowledge_chunks')
        .select('id')
        .eq('content_id', processed.id);

      const chunkIds = (chunkRows ?? []).map((chunk) => chunk.id);

      const [questionsRes, flashcardsRes] = await Promise.all([
        chunkIds.length
          ? supabase
              .from('generated_questions')
              .select('id', { count: 'exact', head: true })
              .in('chunk_id', chunkIds)
          : Promise.resolve({ count: 0 }),
        chunkIds.length
          ? supabase
              .from('flashcards')
              .select('id', { count: 'exact', head: true })
              .in('chunk_id', chunkIds)
          : Promise.resolve({ count: 0 }),
      ]);

      const summaries = Array.isArray((processed.metadata as { summaries?: unknown[] } | null)?.summaries)
        ? ((processed.metadata as { summaries: unknown[] }).summaries?.length ?? 0)
        : 0;

      setPreview({
        rawText: processed.raw_text,
        chunks: (chunkRows ?? []).length,
        questions: questionsRes.count ?? 0,
        flashcards: flashcardsRes.count ?? 0,
        summaries,
      });
    }

    loadPreview().catch(() => setPreview(null));
  }, [selectedUploadId]);

  const handleFiles = useCallback(
    async (incomingFiles: File[]) => {
      if (!centerId || !oposicionId) {
        return;
      }

      const supabase = createClient();
      const validFiles = incomingFiles.filter((file) => isAcceptedUpload(file.name, file.type));
      const invalidFiles = incomingFiles.filter((file) => !isAcceptedUpload(file.name, file.type));

      if (invalidFiles.length > 0) {
        setQueue((prev) => [
          ...invalidFiles.map((file) => ({
            id: `invalid-${Date.now()}-${file.name}`,
            fileName: file.name,
            progress: 0,
            status: 'error' as const,
            error: 'Tipo de archivo no permitido',
          })),
          ...prev,
        ]);
      }

      for (const file of validFiles) {
        const queueId = `${Date.now()}-${file.name}-${Math.random().toString(36).slice(2, 8)}`;
        setQueue((prev) => [{ id: queueId, fileName: file.name, progress: 0, status: 'waiting' }, ...prev]);

        try {
          const safeName = sanitizeFileName(file.name);
          const storagePath = `${centerId}/${oposicionId}/${Date.now()}-${safeName}`;

          setQueue((prev) =>
            prev.map((item) =>
              item.id === queueId
                ? {
                    ...item,
                    status: 'uploading',
                  }
                : item,
            ),
          );

          await uploadContentWithProgress({
            file,
            path: storagePath,
            onProgress: (percent) => {
              setQueue((prev) =>
                prev.map((item) =>
                  item.id === queueId
                    ? {
                        ...item,
                        progress: percent,
                      }
                    : item,
                ),
              );
            },
          });

          const fileType = detectFileType(file.name, file.type || 'application/octet-stream');

          const { data: inserted, error: insertError } = await supabase
            .from('content_uploads')
            .insert({
              center_id: centerId,
              oposicion_id: oposicionId,
              file_name: file.name,
              file_type: fileType,
              mime_type: file.type || 'application/octet-stream',
              storage_path: storagePath,
              status: 'pending',
              progress: 0,
            })
            .select('id')
            .single();

          if (insertError || !inserted) {
            throw new Error(insertError?.message ?? 'No se pudo registrar upload en base de datos');
          }

          const triggerResponse = await fetch('/api/content/reprocess', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uploadId: inserted.id, force: true }),
          });

          if (!triggerResponse.ok) {
            const data = (await triggerResponse.json()) as { error?: string };
            throw new Error(data.error ?? 'No se pudo lanzar el pipeline de procesamiento');
          }

          setQueue((prev) =>
            prev.map((item) =>
              item.id === queueId
                ? {
                    ...item,
                    status: 'queued',
                    progress: 100,
                  }
                : item,
            ),
          );

          await refreshUploads();
        } catch (error) {
          setQueue((prev) =>
            prev.map((item) =>
              item.id === queueId
                ? {
                    ...item,
                    status: 'error',
                    error: (error as Error).message,
                  }
                : item,
            ),
          );
        }
      }
    },
    [centerId, oposicionId, refreshUploads],
  );

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#1B3A5C]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1B3A5C]">Subida de contenido masivo</h1>
        <p className="text-sm text-slate-500">
          Sube PDFs, vídeos, audios, tests e imágenes para que la IA genere material de estudio.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuración de carga</CardTitle>
          <CardDescription>Selecciona centro y oposición antes de subir archivos.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="text-slate-600">Centro</span>
            <select
              value={centerId}
              onChange={(event) => setCenterId(event.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2"
            >
              {centers.map((center) => (
                <option key={center.id} value={center.id}>
                  {center.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-slate-600">Oposición</span>
            <select
              value={oposicionId}
              onChange={(event) => setOposicionId(event.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2"
            >
              {oposiciones.map((oposicion) => (
                <option key={oposicion.id} value={oposicion.id}>
                  {oposicion.name}
                </option>
              ))}
            </select>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dropzone</CardTitle>
          <CardDescription>
            Tipos soportados: {ACCEPTED_UPLOAD_EXTENSIONS.join(', ')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setIsDragging(false);
            }}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              const files = Array.from(event.dataTransfer.files);
              handleFiles(files).catch(() => {});
            }}
            className={`rounded-xl border-2 border-dashed p-8 text-center transition ${
              isDragging
                ? 'border-[#1B3A5C] bg-[#1B3A5C]/5'
                : 'border-slate-300 bg-slate-50'
            }`}
          >
            <UploadCloud className="mx-auto h-10 w-10 text-slate-400" />
            <p className="mt-2 text-sm text-slate-700">
              Arrastra archivos aquí o selecciónalos manualmente
            </p>
            <input
              id="content-upload-input"
              type="file"
              multiple
              accept={acceptedString}
              className="hidden"
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                handleFiles(files).catch(() => {});
                event.currentTarget.value = '';
              }}
            />
            <Button className="mt-4" onClick={() => document.getElementById('content-upload-input')?.click()}>
              Seleccionar archivos
            </Button>
          </div>
        </CardContent>
      </Card>

      {queue.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cola de subida</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {queue.map((item) => (
              <div key={item.id} className="rounded-md border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-slate-900">{item.fileName}</p>
                  <span className="text-xs text-slate-500">{item.status}</span>
                </div>
                <div className="mt-2 space-y-1">
                  <Progress value={item.progress} />
                  <p className="text-xs text-slate-500">{item.progress}%</p>
                </div>
                {item.error && <p className="mt-2 text-xs text-rose-700">{item.error}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Uploads recientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {uploads.length === 0 ? (
              <p className="text-sm text-slate-500">Aún no hay uploads.</p>
            ) : (
              uploads.map((upload) => (
                <button
                  type="button"
                  key={upload.id}
                  onClick={() => setSelectedUploadId(upload.id)}
                  className={`w-full rounded-md border px-3 py-2 text-left transition ${
                    selectedUploadId === upload.id
                      ? 'border-[#1B3A5C] bg-[#1B3A5C]/5'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-slate-900">{upload.file_name}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${statusBadgeClass(upload.status)}`}>
                      {statusLabel(upload.status)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {upload.organizations?.name ?? 'Centro'} · {upload.oppositions?.name ?? 'Oposición'}
                  </p>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preview de contenido procesado</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedUploadId ? (
              <p className="text-sm text-slate-500">Selecciona un upload para ver el preview.</p>
            ) : !preview ? (
              <p className="text-sm text-slate-500">Sin contenido procesado todavía.</p>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-md bg-slate-100 p-2">Chunks: {preview.chunks}</div>
                  <div className="rounded-md bg-slate-100 p-2">Preguntas: {preview.questions}</div>
                  <div className="rounded-md bg-slate-100 p-2">Flashcards: {preview.flashcards}</div>
                  <div className="rounded-md bg-slate-100 p-2">Resúmenes: {preview.summaries}</div>
                </div>

                <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="mb-1 text-xs font-medium text-slate-700">Texto extraído</p>
                  <p className="line-clamp-12 whitespace-pre-wrap text-xs text-slate-600">
                    {preview.rawText.slice(0, 3000)}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tipos de archivo aceptados</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {ACCEPTED_UPLOAD_EXTENSIONS.map((ext) => (
            <div key={ext} className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm">
              <FileText className="h-4 w-4 text-slate-500" />
              {ext.toUpperCase()}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
