'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function OposicionNotFound() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-16">
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle>Oposicion no encontrada</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">
            El slug solicitado no existe en el catalogo actual de Oposita+.
          </p>
          <Link href="/oposiciones">
            <Button>Volver al catalogo</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
