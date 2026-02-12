import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Calendar, Clock, MessageCircle, Repeat, ShieldCheck, Target, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DemoSeedActions } from '@/components/oposiciones/demo-seed-actions';
import { getOposicionBySlug } from '@/data/oposiciones';
import { difficultyBadgeClass, difficultyLabel } from '@/lib/oposicion-ui';

const tools = [
  {
    href: 'test',
    title: 'Tests adaptativos',
    description: 'Practica por tema y dificultad para detectar puntos débiles.',
    Icon: Target,
  },
  {
    href: 'tutor',
    title: 'Preparador personal',
    description: 'Resuelve dudas del temario con enfoque de examen.',
    Icon: MessageCircle,
  },
  {
    href: 'planner',
    title: 'Planificador de estudio',
    description: 'Organiza semanas de estudio según fecha objetivo.',
    Icon: Calendar,
  },
  {
    href: 'review',
    title: 'Repaso inteligente',
    description: 'Vuelve sobre errores y consolida conceptos clave.',
    Icon: Repeat,
  },
  {
    href: 'simulacro',
    title: 'Simulacro de examen',
    description: 'Entrena formato examen con tiempo real.',
    Icon: Clock,
  },
  {
    href: 'dashboard',
    title: 'Tu progreso',
    description: 'Visualiza evolución por tests y rendimiento por temas.',
    Icon: TrendingUp,
  },
];

export default async function OposicionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const oposicion = getOposicionBySlug(slug);

  if (!oposicion) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-5 flex items-center gap-2 text-sm text-slate-600">
          <Link href="/" className="hover:text-slate-900">
            Inicio
          </Link>
          <span>{'>'}</span>
          <Link href="/oposiciones" className="hover:text-slate-900">
            Oposiciones
          </Link>
          <span>{'>'}</span>
          <span className="font-semibold text-slate-900">{oposicion.shortName}</span>
        </div>

        <Card className="mb-6 border-slate-200 bg-white">
          <CardHeader>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="outline">{oposicion.category}</Badge>
              <Badge className={`border ${difficultyBadgeClass(oposicion.difficulty)}`}>
                Dificultad {difficultyLabel(oposicion.difficulty)}
              </Badge>
            </div>
            <CardTitle className="text-3xl text-[#1B3A5C]">{oposicion.name}</CardTitle>
            <CardDescription>{oposicion.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
                <ShieldCheck className="h-4 w-4" />
                Contenido validado por CIP Formación
              </p>
              <p className="mt-1 text-xs text-emerald-800">
                {oposicion.centro.certifications.join(' · ')} · {oposicion.centro.location}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Descripción</h2>
                <p className="mt-1 text-sm text-slate-700">{oposicion.description}</p>
              </div>
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Requisitos</h2>
                <p className="mt-1 text-sm text-slate-700">{oposicion.requirements}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6 border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-xl text-[#1B3A5C]">Temario</CardTitle>
            <CardDescription>Bloques oficiales y número de preguntas disponibles.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {oposicion.topics.map((topic) => (
                <div key={topic.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="font-medium text-slate-900">{topic.name}</p>
                  <p className="text-xs text-slate-600">{topic.questionCount} preguntas</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <section>
          <h2 className="mb-4 text-xl font-bold text-[#1B3A5C]">Herramientas</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool) => {
              const Icon = tool.Icon;
              return (
                <Card key={tool.href} className="border-slate-200 bg-white">
                  <CardHeader>
                    <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#1B3A5C] text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg text-[#1B3A5C]">{tool.title}</CardTitle>
                    <CardDescription>{tool.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href={`/oposiciones/${oposicion.slug}/${tool.href}`}>
                      <Button variant="outline" className="w-full">
                        Abrir
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <DemoSeedActions slug={oposicion.slug} />
      </section>
    </main>
  );
}
