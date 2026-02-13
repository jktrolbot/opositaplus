'use client';

import { useEffect, useState } from 'react';
import { BookOpen, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOrganization } from '@/lib/hooks/use-organization';
import { createClient } from '@/lib/supabase/client';

interface OppositionRow {
  opposition_id: string;
  oppositions: { name: string; slug: string; description: string | null };
}

export default function OposicionesPage() {
  const { organization, isLoading: orgLoading } = useOrganization();
  const [oppositions, setOppositions] = useState<OppositionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organization) return;
    const supabase = createClient();
    supabase
      .from('organization_oppositions')
      .select('opposition_id, oppositions(name, slug, description)')
      .eq('organization_id', organization.id)
      .then(({ data }) => {
        setOppositions((data ?? []) as unknown as OppositionRow[]);
        setLoading(false);
      });
  }, [organization]);

  if (orgLoading || loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#1B3A5C]" />
      </div>
    );
  }

  const slug = organization?.slug ?? '';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1B3A5C]">Oposiciones</h1>
        <p className="text-sm text-slate-500">Herramientas IA disponibles para cada oposición</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {oppositions.map((o) => (
          <Link key={o.opposition_id} href={`/centro/${slug}/oposiciones/${o.oppositions.slug}`}>
            <Card className="border-slate-200 transition hover:shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpen className="h-4 w-4 text-[#1B3A5C]" />
                  {o.oppositions.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500">{o.oppositions.description ?? 'Sin descripción'}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {['Test', 'Tutor IA', 'Planificador', 'Simulacro', 'Repaso'].map((tool) => (
                    <span key={tool} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{tool}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
