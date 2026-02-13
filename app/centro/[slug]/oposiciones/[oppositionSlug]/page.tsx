'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Brain, Calendar, ClipboardCheck, FileQuestion, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const tools = [
  { slug: 'test', label: 'Test', icon: FileQuestion, description: 'Practica con tests tipo examen' },
  { slug: 'tutor', label: 'Tutor IA', icon: Brain, description: 'Pregunta a tu tutor de IA' },
  { slug: 'planner', label: 'Planificador', icon: Calendar, description: 'Plan de estudio personalizado' },
  { slug: 'simulacro', label: 'Simulacro', icon: ClipboardCheck, description: 'Simulacro de examen real' },
  { slug: 'review', label: 'Repaso', icon: RotateCcw, description: 'Repasa tus errores' },
  { slug: 'dashboard', label: 'Dashboard', icon: BookOpen, description: 'Tu progreso y estadísticas' },
];

export default function OppositionToolsPage({
  params,
}: {
  params: Promise<{ slug: string; oppositionSlug: string }>;
}) {
  const { slug, oppositionSlug } = use(params);

  return (
    <div className="space-y-6">
      <Link href={`/centro/${slug}/oposiciones`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" />
        Volver a oposiciones
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-[#1B3A5C]">Herramientas - {oppositionSlug}</h1>
        <p className="text-sm text-slate-500">Selecciona una herramienta de estudio</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <Link key={tool.slug} href={`/centro/${slug}/oposiciones/${oppositionSlug}/${tool.slug}`}>
            <Card className="border-slate-200 transition hover:shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <tool.icon className="h-5 w-5 text-[#1B3A5C]" />
                  {tool.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500">{tool.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
