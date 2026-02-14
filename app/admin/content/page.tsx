'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Loader2, RefreshCw, Sparkles, UploadCloud } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

type UploadStatus = 'pending' | 'processing' | 'completed' | 'failed';

type UploadRow = {
  id: string;
  file_name: string;
  file_type: string;
  status: UploadStatus;
  progress: number;
  error_message: string | null;
  created_at: string;
  oposicion_id: string;
  metadata: Record<string, unknown> | null;
  organizations?: { name?: string | null } | null;
  oppositions?: { name?: string | null } | null;
};

const STATUS_LABEL: Record<UploadStatus, string> = {
  pending: 'Pendiente',
  processing: 'Procesando',
  completed: 'Completado',
  failed: 'Fallido',
};

function statusClasses(status: UploadStatus) {
  if (status === 'completed') return 'bg-emerald-100 text-emerald-700';
  if (status === 'processing') return 'bg-blue-100 text-blue-700';
  if (status === 'failed') return 'bg-rose-100 text-rose-700';
  return 'bg-amber-100 text-amber-700';
}

function defaultProgress(status: UploadStatus) {
  if (status === 'completed' || status === 'failed') return 100;
  if (status === 'processing') return 65;
  return 10;
}

export default function AdminContentDashboardPage() {
  const [uploads, setUploads] = useState<UploadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [reprocessingId, setReprocessingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | UploadStatus>('all');
  const [oposicionFilter, setOposicionFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [oposiciones, setOposiciones] = useState<Array<{ id: string; name: string }>>([]);
  const [stats, setStats] = useState({ questions: 0, flashcards: 0, chunks: 0 });

  const loadData = useCallback(async () => {
    const supabase = createClient();

    let uploadsQuery = supabase
      .from('content_uploads')
      .select('id, file_name, file_type, status, progress, error_message, created_at, oposicion_id, metadata, organizations(name), oppositions(name)')
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      uploadsQuery = uploadsQuery.eq('status', statusFilter);
    }

    if (oposicionFilter !== 'all') {
      uploadsQuery = uploadsQuery.eq('oposicion_id', oposicionFilter);
    }

    if (dateFrom) {
      uploadsQuery = uploadsQuery.gte('created_at', `${dateFrom}T00:00:00`);
    }

    if (dateTo) {
      uploadsQuery = uploadsQuery.lte('created_at', `${dateTo}T23:59:59`);
    }

    const [uploadsRes, oposicionesRes, questionsRes, flashcardsRes, chunksRes] = await Promise.all([
      uploadsQuery,
      supabase.from('oppositions').select('id, name').order('name'),
      (() => {
        let query = supabase.from('generated_questions').select('*', { head: true, count: 'exact' });
        if (oposicionFilter !== 'all') query = query.eq('oposicion_id', oposicionFilter);
        return query;
      })(),
      (() => {
        let query = supabase.from('flashcards').select('*', { head: true, count: 'exact' });
        if (oposicionFilter !== 'all') query = query.eq('oposicion_id', oposicionFilter);
        return query;
      })(),
      (() => {
        let query = supabase.from('knowledge_chunks').select('*', { head: true, count: 'exact' });
        if (oposicionFilter !== 'all') query = query.eq('oposicion_id', oposicionFilter);
        return query;
      })(),
    ]);

    setUploads((uploadsRes.data ?? []) as unknown as UploadRow[]);
    setOposiciones(oposicionesRes.data ?? []);
    setStats({
      questions: questionsRes.count ?? 0,
      flashcards: flashcardsRes.count ?? 0,
      chunks: chunksRes.count ?? 0,
    });

    setLoading(false);
  }, [statusFilter, oposicionFilter, dateFrom, dateTo]);

  useEffect(() => {
    loadData().catch(() => setLoading(false));
  }, [loadData]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadData().catch(() => {});
    }, 12000);

    return () => clearInterval(interval);
  }, [loadData]);

  const failedCount = useMemo(
    () => uploads.filter((upload) => upload.status === 'failed').length,
    [uploads],
  );

  async function reprocessUpload(uploadId: string, force = true) {
    setReprocessingId(uploadId);
    try {
      const response = await fetch('/api/content/reprocess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploadId, force }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? 'No se pudo lanzar el reproceso');
      }

      await loadData();
    } catch (error) {
      console.error(error);
    } finally {
      setReprocessingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#1B3A5C]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1B3A5C]">Onboarding Inteligente</h1>
          <p className="text-sm text-slate-500">Supervisa procesamiento, calidad y material generado por IA.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => loadData()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
          <Link href="/admin/content/upload">
            <Button className="bg-[#1B3A5C] text-white hover:bg-[#16314d]">
              <UploadCloud className="mr-2 h-4 w-4" />
              Subir contenido
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Preguntas generadas</CardDescription>
            <CardTitle className="text-3xl">{stats.questions}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Flashcards generadas</CardDescription>
            <CardTitle className="text-3xl">{stats.flashcards}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Chunks indexados</CardDescription>
            <CardTitle className="text-3xl">{stats.chunks}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Fallos pendientes</CardDescription>
            <CardTitle className="text-3xl text-rose-700">{failedCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1 text-sm">
            <span className="text-slate-600">Estado</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as 'all' | UploadStatus)}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2"
            >
              <option value="all">Todos</option>
              <option value="pending">Pendiente</option>
              <option value="processing">Procesando</option>
              <option value="completed">Completado</option>
              <option value="failed">Fallido</option>
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-slate-600">Oposición</span>
            <select
              value={oposicionFilter}
              onChange={(event) => setOposicionFilter(event.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2"
            >
              <option value="all">Todas</option>
              {oposiciones.map((oposicion) => (
                <option key={oposicion.id} value={oposicion.id}>
                  {oposicion.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-slate-600">Desde</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-slate-600">Hasta</span>
            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2"
            />
          </label>
        </CardContent>
      </Card>

      {uploads.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-slate-500">
            No hay uploads para los filtros seleccionados.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {uploads.map((upload) => {
            const progress = upload.progress > 0 ? upload.progress : defaultProgress(upload.status);
            return (
              <Card key={upload.id}>
                <CardContent className="space-y-3 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{upload.file_name}</p>
                      <p className="text-xs text-slate-500">
                        {upload.organizations?.name ?? 'Centro'} · {upload.oppositions?.name ?? 'Oposición'} ·{' '}
                        {new Date(upload.created_at).toLocaleString('es-ES')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClasses(upload.status)}`}>
                        {STATUS_LABEL[upload.status]}
                      </span>
                      {(upload.status === 'failed' || upload.status === 'completed') && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={reprocessingId === upload.id}
                          onClick={() => reprocessUpload(upload.id, true)}
                        >
                          {reprocessingId === upload.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <RefreshCw className="mr-1 h-3.5 w-3.5" /> Reprocesar
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Progress value={progress} />
                    <p className="text-xs text-slate-500">{progress}%</p>
                  </div>

                  {upload.status === 'failed' && upload.error_message && (
                    <div className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5" />
                      <span>{upload.error_message}</span>
                    </div>
                  )}

                  {upload.status === 'completed' && (
                    <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
                      <Sparkles className="h-3.5 w-3.5" />
                      Material generado y listo para estudio.
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
