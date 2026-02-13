'use client';

import { use } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';

export default function CentroToolPage({
  params,
}: {
  params: Promise<{ slug: string; oppositionSlug: string }>;
}) {
  const { slug, oppositionSlug } = use(params);
  const toolName = 'test';

  return (
    <div className="space-y-6">
      <Link href={`/centro/${slug}/oposiciones/${oppositionSlug}`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" />
        Volver
      </Link>
      <h1 className="text-2xl font-bold text-[#1B3A5C]">{toolName} — {oppositionSlug}</h1>
      <Card className="border-slate-200">
        <CardContent className="py-10 text-center">
          <p className="text-sm text-slate-500">
            Esta herramienta reutiliza los componentes existentes de /oposiciones/[slug]/{toolName}.
            Requiere suscripción activa para acceder.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
