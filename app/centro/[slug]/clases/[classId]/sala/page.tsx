'use client';

import { use } from 'react';
import { ArrowLeft, Video } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';

export default function SalaPage({
  params,
}: {
  params: Promise<{ slug: string; classId: string }>;
}) {
  const { slug, classId } = use(params);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-2">
        <Link href={`/centro/${slug}/clases/${classId}`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-center bg-slate-900">
        <Card className="border-slate-700 bg-slate-800">
          <CardContent className="py-10 text-center">
            <Video className="mx-auto h-16 w-16 text-slate-500" />
            <p className="mt-4 text-lg font-medium text-white">Sala de clase en directo</p>
            <p className="mt-2 text-sm text-slate-400">
              La integración con 100ms se activará cuando se configuren las credenciales.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Instala @100mslive/roomkit-react cuando estés listo para producción.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
