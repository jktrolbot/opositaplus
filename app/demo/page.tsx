'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  Brain,
  ChevronDown,
  ChevronRight,
  Database,
  FileText,
  FlaskConical,
  Layers,
  Sparkles,
  Tag,
  Upload,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Types
type TemaStats = { tema: string; count: number };
type UploadInfo = {
  id: string;
  file_name: string;
  file_type: string;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
};
type Overview = {
  oposicion: { id: string; name: string };
  stats: {
    chunks: number;
    questions: number;
    flashcards: number;
    uploads: number;
    temas: TemaStats[];
  };
  uploads: UploadInfo[];
};
type QuestionItem = {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  difficulty: number;
  metadata: Record<string, unknown>;
  knowledge_chunks: { tema: string; source_ref: string; tags: string[] };
};
type FlashcardItem = {
  id: string;
  front: string;
  back: string;
  tags: string[];
  difficulty: number;
  metadata: Record<string, unknown>;
  knowledge_chunks: { tema: string; source_ref: string; tags: string[] };
};
type ChunkItem = {
  id: string;
  tema: string;
  chunk_text: string;
  tags: string[];
  source_ref: string;
  created_at: string;
};

type Tab = 'overview' | 'content' | 'questions' | 'flashcards';

function SourceBadge({ sourceRef }: { sourceRef: string }) {
  if (!sourceRef) return null;
  const [file, chunk] = sourceRef.split('#');
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 border border-blue-200">
      <FileText className="h-3 w-3" />
      {file}
      {chunk && <span className="text-blue-400">#{chunk}</span>}
    </span>
  );
}

function DifficultyBadge({ level }: { level: number }) {
  const colors: Record<number, string> = {
    1: 'bg-green-50 text-green-700 border-green-200',
    2: 'bg-lime-50 text-lime-700 border-lime-200',
    3: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    4: 'bg-orange-50 text-orange-700 border-orange-200',
    5: 'bg-red-50 text-red-700 border-red-200',
  };
  const labels: Record<number, string> = {
    1: 'Muy fácil', 2: 'Fácil', 3: 'Media', 4: 'Difícil', 5: 'Muy difícil',
  };
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${colors[level] ?? colors[3]}`}>
      {labels[level] ?? `Nivel ${level}`}
    </span>
  );
}

export default function DemoPage() {
  const [tab, setTab] = useState<Tab>('overview');
  const [overview, setOverview] = useState<Overview | null>(null);
  const [selectedTema, setSelectedTema] = useState<string | null>(null);
  const [chunks, setChunks] = useState<ChunkItem[]>([]);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [flashcards, setFlashcards] = useState<FlashcardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedChunks, setExpandedChunks] = useState<Set<string>>(new Set());
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());
  const [chunkPage, setChunkPage] = useState(1);
  const [qPage, setQPage] = useState(1);
  const [fcPage, setFcPage] = useState(1);

  // Load overview on mount
  useEffect(() => {
    fetch('/api/demo/content?type=overview')
      .then((r) => r.json())
      .then((data: Overview) => setOverview(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const loadContent = useCallback(async (contentType: Tab, tema: string | null, page = 1) => {
    setLoading(true);
    const temaParam = tema ? `&tema=${encodeURIComponent(tema)}` : '';
    try {
      const res = await fetch(`/api/demo/content?type=${contentType}&page=${page}&limit=20${temaParam}`);
      const data = await res.json();
      if (contentType === 'content') setChunks(data.data ?? []);
      if (contentType === 'questions') setQuestions(data.data ?? []);
      if (contentType === 'flashcards') setFlashcards(data.data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleTabChange(newTab: Tab) {
    setTab(newTab);
    if (newTab !== 'overview') {
      const typeMap: Record<string, string> = { content: 'chunks', questions: 'questions', flashcards: 'flashcards' };
      loadContent(newTab, selectedTema, 1);
      if (newTab === 'content') setChunkPage(1);
      if (newTab === 'questions') setQPage(1);
      if (newTab === 'flashcards') setFcPage(1);
    }
  }

  function handleTemaFilter(tema: string | null) {
    setSelectedTema(tema);
    if (tab !== 'overview') {
      loadContent(tab, tema, 1);
    }
  }

  if (loading && !overview) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#1B3A5C]" />
          <p className="text-sm text-slate-500">Cargando demo de Oposita+...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-slate-400 hover:text-slate-600">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#1B3A5C]">Demo: Knowledge Base IA</h1>
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">LIVE</Badge>
              </div>
              <p className="text-sm text-slate-500">
                {overview?.oposicion.name} · CIP Formación
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Stats bar */}
        {overview && (
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card className="border-slate-200">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg bg-blue-50 p-2"><Upload className="h-5 w-5 text-blue-600" /></div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{overview.stats.uploads}</p>
                  <p className="text-xs text-slate-500">Archivos fuente</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-200">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg bg-purple-50 p-2"><Layers className="h-5 w-5 text-purple-600" /></div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{overview.stats.chunks.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">Fragmentos de conocimiento</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-200">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg bg-amber-50 p-2"><FlaskConical className="h-5 w-5 text-amber-600" /></div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{overview.stats.questions}</p>
                  <p className="text-xs text-slate-500">Preguntas extraídas</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-200">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg bg-emerald-50 p-2"><Brain className="h-5 w-5 text-emerald-600" /></div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{overview.stats.flashcards.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">Flashcards generadas</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-4 flex gap-1 rounded-lg bg-slate-100 p-1">
          {([
            ['overview', 'Resumen', Database],
            ['content', 'Contenido', BookOpen],
            ['questions', 'Preguntas', FlaskConical],
            ['flashcards', 'Flashcards', Brain],
          ] as const).map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => handleTabChange(key as Tab)}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                tab === key
                  ? 'bg-white text-[#1B3A5C] shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tema filter */}
        {overview && tab !== 'overview' && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            <button
              onClick={() => handleTemaFilter(null)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                !selectedTema ? 'bg-[#1B3A5C] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos
            </button>
            {overview.stats.temas.map((t) => (
              <button
                key={t.tema}
                onClick={() => handleTemaFilter(t.tema)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  selectedTema === t.tema
                    ? 'bg-[#1B3A5C] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t.tema} ({t.count})
              </button>
            ))}
          </div>
        )}

        {/* Tab content */}
        {tab === 'overview' && overview && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Temas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-[#1B3A5C]" />
                  Temas del temario
                </CardTitle>
                <CardDescription>
                  {overview.stats.temas.length} temas con contenido procesado de 36 totales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {overview.stats.temas.map((t) => (
                    <button
                      key={t.tema}
                      onClick={() => { setSelectedTema(t.tema); handleTabChange('content'); }}
                      className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-slate-50 transition-colors"
                    >
                      <span className="font-medium text-slate-700">{t.tema}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">{t.count} fragmentos</span>
                        <ChevronRight className="h-4 w-4 text-slate-300" />
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Source files */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#1B3A5C]" />
                  Archivos fuente ({overview.uploads.length})
                </CardTitle>
                <CardDescription>
                  Trazabilidad completa: cada fragmento enlaza a su archivo original
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-[500px] space-y-1 overflow-y-auto">
                  {overview.uploads.map((u) => {
                    const meta = u.metadata as { temas?: string[]; type?: string; academicYear?: string };
                    return (
                      <div key={u.id} className="flex items-start gap-2 rounded-md px-3 py-2 hover:bg-slate-50">
                        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-700">{u.file_name}</p>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {meta?.type && (
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                                {meta.type}
                              </span>
                            )}
                            {meta?.academicYear && (
                              <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] text-indigo-600">
                                {meta.academicYear}
                              </span>
                            )}
                            {meta?.temas?.map((t) => (
                              <span key={t} className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-600">
                                T{t}
                              </span>
                            ))}
                          </div>
                        </div>
                        <Badge variant="outline" className="ml-auto shrink-0 text-[10px]">
                          {u.status}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* How it works */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  Cómo funciona el pipeline de Oposita+
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-5">
                  {[
                    { step: '1', title: 'Upload', desc: 'El centro sube PDFs, vídeos y tests', icon: Upload },
                    { step: '2', title: 'Extracción', desc: 'IA extrae texto, OCR en escaneados', icon: FileText },
                    { step: '3', title: 'Clasificación', desc: 'Asignación automática a temas y etiquetas', icon: Tag },
                    { step: '4', title: 'Generación', desc: 'Preguntas, flashcards y tests automáticos', icon: FlaskConical },
                    { step: '5', title: 'Estudio', desc: 'FSRS-6, repaso espaciado, tutor IA', icon: Brain },
                  ].map((s) => (
                    <div key={s.step} className="text-center">
                      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#1B3A5C] text-sm font-bold text-white">
                        {s.step}
                      </div>
                      <s.icon className="mx-auto mb-1 h-5 w-5 text-slate-500" />
                      <p className="text-sm font-semibold text-slate-800">{s.title}</p>
                      <p className="text-xs text-slate-500">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {tab === 'content' && (
          <div className="space-y-3">
            {loading ? (
              <Card><CardContent className="py-10 text-center text-sm text-slate-500">Cargando contenido...</CardContent></Card>
            ) : chunks.length === 0 ? (
              <Card><CardContent className="py-10 text-center text-sm text-slate-500">No hay contenido para este filtro.</CardContent></Card>
            ) : (
              <>
                {chunks.map((chunk) => {
                  const isExpanded = expandedChunks.has(chunk.id);
                  return (
                    <Card key={chunk.id} className="border-slate-200">
                      <CardContent className="p-4">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          {chunk.tema && <Badge className="bg-[#1B3A5C] text-white">{chunk.tema}</Badge>}
                          <SourceBadge sourceRef={chunk.source_ref} />
                          {chunk.tags?.map((tag) => (
                            <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <p className={`text-sm text-slate-700 whitespace-pre-wrap ${isExpanded ? '' : 'line-clamp-4'}`}>
                          {chunk.chunk_text}
                        </p>
                        {chunk.chunk_text.length > 300 && (
                          <button
                            onClick={() => {
                              const next = new Set(expandedChunks);
                              isExpanded ? next.delete(chunk.id) : next.add(chunk.id);
                              setExpandedChunks(next);
                            }}
                            className="mt-1 flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                          >
                            <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            {isExpanded ? 'Ver menos' : 'Ver más'}
                          </button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
                <div className="flex justify-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={chunkPage <= 1}
                    onClick={() => { setChunkPage(chunkPage - 1); loadContent('content', selectedTema, chunkPage - 1); }}
                  >
                    Anterior
                  </Button>
                  <span className="flex items-center text-sm text-slate-500">Página {chunkPage}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={chunks.length < 20}
                    onClick={() => { setChunkPage(chunkPage + 1); loadContent('content', selectedTema, chunkPage + 1); }}
                  >
                    Siguiente
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {tab === 'questions' && (
          <div className="space-y-3">
            {loading ? (
              <Card><CardContent className="py-10 text-center text-sm text-slate-500">Cargando preguntas...</CardContent></Card>
            ) : questions.length === 0 ? (
              <Card><CardContent className="py-10 text-center text-sm text-slate-500">No hay preguntas para este filtro.</CardContent></Card>
            ) : (
              <>
                {questions.map((q) => (
                  <Card key={q.id} className="border-slate-200">
                    <CardContent className="p-4">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        {q.knowledge_chunks?.tema && (
                          <Badge className="bg-[#1B3A5C] text-white">{q.knowledge_chunks.tema}</Badge>
                        )}
                        <DifficultyBadge level={q.difficulty} />
                        {q.knowledge_chunks?.source_ref && (
                          <SourceBadge sourceRef={q.knowledge_chunks.source_ref} />
                        )}
                      </div>
                      <p className="mb-3 text-sm font-medium text-slate-800">{q.question_text}</p>
                      {q.explanation && (
                        <div className="rounded-md bg-slate-50 p-3">
                          <p className="text-xs font-semibold text-slate-500 mb-1">Referencia / Explicación</p>
                          <p className="text-xs text-slate-600">{q.explanation}</p>
                        </div>
                      )}
                      {q.metadata && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {(q.metadata as { source?: string }).source && (
                            <span className="text-[10px] text-slate-400">
                              Fuente: {(q.metadata as { source: string }).source}
                            </span>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                <div className="flex justify-center gap-2 pt-2">
                  <Button variant="outline" size="sm" disabled={qPage <= 1}
                    onClick={() => { setQPage(qPage - 1); loadContent('questions', selectedTema, qPage - 1); }}>
                    Anterior
                  </Button>
                  <span className="flex items-center text-sm text-slate-500">Página {qPage}</span>
                  <Button variant="outline" size="sm" disabled={questions.length < 20}
                    onClick={() => { setQPage(qPage + 1); loadContent('questions', selectedTema, qPage + 1); }}>
                    Siguiente
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {tab === 'flashcards' && (
          <div className="space-y-3">
            {loading ? (
              <Card><CardContent className="py-10 text-center text-sm text-slate-500">Cargando flashcards...</CardContent></Card>
            ) : flashcards.length === 0 ? (
              <Card><CardContent className="py-10 text-center text-sm text-slate-500">No hay flashcards para este filtro.</CardContent></Card>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  {flashcards.map((fc) => {
                    const isFlipped = flippedCards.has(fc.id);
                    return (
                      <Card
                        key={fc.id}
                        className="cursor-pointer border-slate-200 transition-all hover:shadow-md"
                        onClick={() => {
                          const next = new Set(flippedCards);
                          isFlipped ? next.delete(fc.id) : next.add(fc.id);
                          setFlippedCards(next);
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            {fc.knowledge_chunks?.tema && (
                              <Badge className="bg-[#1B3A5C] text-white text-[10px]">{fc.knowledge_chunks.tema}</Badge>
                            )}
                            <DifficultyBadge level={fc.difficulty} />
                            {fc.knowledge_chunks?.source_ref && (
                              <SourceBadge sourceRef={fc.knowledge_chunks.source_ref} />
                            )}
                          </div>
                          <div className="min-h-[80px]">
                            {!isFlipped ? (
                              <>
                                <p className="text-xs font-semibold uppercase text-slate-400 mb-1">Pregunta</p>
                                <p className="text-sm text-slate-800">{fc.front}</p>
                                <p className="mt-2 text-[10px] text-slate-400 italic">Toca para ver respuesta</p>
                              </>
                            ) : (
                              <>
                                <p className="text-xs font-semibold uppercase text-emerald-500 mb-1">Respuesta</p>
                                <p className="text-sm text-slate-700">{fc.back}</p>
                                <p className="mt-2 text-[10px] text-slate-400 italic">Toca para volver</p>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                <div className="flex justify-center gap-2 pt-2">
                  <Button variant="outline" size="sm" disabled={fcPage <= 1}
                    onClick={() => { setFcPage(fcPage - 1); loadContent('flashcards', selectedTema, fcPage - 1); }}>
                    Anterior
                  </Button>
                  <span className="flex items-center text-sm text-slate-500">Página {fcPage}</span>
                  <Button variant="outline" size="sm" disabled={flashcards.length < 20}
                    onClick={() => { setFcPage(fcPage + 1); loadContent('flashcards', selectedTema, fcPage + 1); }}>
                    Siguiente
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
