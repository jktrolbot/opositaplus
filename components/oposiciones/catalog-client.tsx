'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { categories, oposiciones } from '@/data/oposiciones';
import { difficultyBadgeClass, difficultyLabel } from '@/lib/oposicion-ui';

interface CatalogClientProps {
  initialCategory?: string;
}

export function CatalogClient({ initialCategory = 'Todas' }: CatalogClientProps) {
  const [activeCategory, setActiveCategory] = useState(initialCategory);

  const categoryTabs = useMemo(
    () => ['Todas', ...categories.map((category) => category.name)],
    [],
  );

  const filtered = useMemo(() => {
    if (activeCategory === 'Todas') return oposiciones;
    return oposiciones.filter((oposicion) => oposicion.category === activeCategory);
  }, [activeCategory]);

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#1B3A5C]">Catálogo de oposiciones</h1>
          <p className="mt-1 text-sm text-slate-600">Selecciona una categoría y entra en la oposición que quieres preparar.</p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {categoryTabs.map((category) => {
            const active = category === activeCategory;
            return (
              <button
                type="button"
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  active
                    ? 'bg-[#1B3A5C] text-white'
                    : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((oposicion) => (
            <Card key={oposicion.slug} className="border-slate-200 bg-white">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-xl text-[#1B3A5C]">{oposicion.shortName}</CardTitle>
                  <Badge className={`border ${difficultyBadgeClass(oposicion.difficulty)}`}>
                    {difficultyLabel(oposicion.difficulty)}
                  </Badge>
                </div>
                <CardDescription>{oposicion.name}</CardDescription>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{oposicion.category}</Badge>
                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                    <ShieldCheck className="mr-1 h-3 w-3" />
                    CIP Formación
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-600">
                  {oposicion.topics.length} temas · {oposicion.totalQuestions} preguntas
                </p>
                <Link href={`/oposiciones/${oposicion.slug}`}>
                  <Button className="w-full bg-[#1B3A5C] text-white hover:bg-[#16314d]">Ver oposición</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
