'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { isDemoSlugSupported, seedDemoData } from '@/lib/demo-data';

interface DemoSeedActionsProps {
  slug: string;
}

export function DemoSeedActions({ slug }: DemoSeedActionsProps) {
  const router = useRouter();
  const autoSeeded = useRef(false);
  const isSupported = isDemoSlugSupported(slug);

  useEffect(() => {
    if (!isSupported || autoSeeded.current) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('demo') !== 'true') return;

    autoSeeded.current = true;
    seedDemoData(slug);
    router.replace(`/oposiciones/${slug}/dashboard`);
  }, [isSupported, router, slug]);

  if (!isSupported) return null;

  const handleSeedClick = () => {
    seedDemoData(slug);
    window.alert('Datos de demostración cargados');
  };

  return (
    <div className="mt-8 flex justify-end">
      <Button
        type="button"
        variant="ghost"
        className="h-auto px-2 py-1 text-xs font-normal text-slate-500 hover:bg-transparent hover:text-slate-700 hover:underline"
        onClick={handleSeedClick}
      >
        Cargar datos de demostración
      </Button>
    </div>
  );
}
