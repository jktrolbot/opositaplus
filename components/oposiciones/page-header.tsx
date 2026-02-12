'use client';

import Link from 'next/link';
import { ChevronRight, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Oposicion } from '@/data/oposiciones';

interface OposicionPageHeaderProps {
  oposicion: Oposicion;
  current: string;
}

export function OposicionPageHeader({ oposicion, current }: OposicionPageHeaderProps) {
  return (
    <header className="sticky top-16 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-4 py-4">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <Link href="/" className="hover:text-slate-900">
            Inicio
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/oposiciones" className="hover:text-slate-900">
            Oposiciones
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href={`/oposiciones/${oposicion.slug}`} className="hover:text-slate-900">
            {oposicion.shortName}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="font-semibold text-slate-900">{current}</span>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">{oposicion.category}</p>
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{oposicion.name}</h1>
          </div>
          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
            <ShieldCheck className="mr-1 h-3 w-3" />
            Validado por {oposicion.centro.name}
          </Badge>
        </div>
      </div>
    </header>
  );
}
