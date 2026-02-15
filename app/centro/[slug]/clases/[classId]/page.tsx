'use client';

import { use, useEffect, useState } from 'react';
import { Loader2, Video, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOrganization } from '@/lib/hooks/use-organization';
import { createClient } from '@/lib/supabase/client';

interface ClassDetail {
  id: string;
  title: string;
  description: string | null;
  type: string;
  starts_at: string | null;
  ends_at: string | null;
  status: string;
  meeting_url: string | null;
  meeting_id: string | null;
}

export default function ClassDetailPage({
  params,
}: {
  params: Promise<{ slug: string; classId: string }>;
}) {
  const { slug, classId } = use(params);
  const { isLoading: orgLoading } = useOrganization();
  const [cls, setCls] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('classes')
      .select('*')
      .eq('id', classId)
      .single()
      .then(({ data }) => {
        setCls(data as unknown as ClassDetail);
        setLoading(false);
      });
  }, [classId]);

  if (orgLoading || loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#1B3A5C]" />
      </div>
    );
  }

  if (!cls) {
    return <p className="text-slate-500">Clase no encontrada.</p>;
  }

  return (
    <div className="space-y-6">
      <Link href={`/centro/${slug}/clases`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" />
        Volver a clases
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1B3A5C]">{cls.title}</h1>
        {cls.meeting_id && cls.status !== 'completed' && (
          <Link href={`/centro/${slug}/clases/${classId}/sala`}>
            <Button className="bg-emerald-600 text-white hover:bg-emerald-700">
              <Video className="mr-2 h-4 w-4" />
              Entrar a la sala
            </Button>
          </Link>
        )}
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-slate-500">Detalles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {cls.description && <p className="text-slate-600">{cls.description}</p>}
          <p><strong>Tipo:</strong> {cls.type === 'live' ? 'En directo' : cls.type === 'recorded' ? 'Grabada' : 'Híbrida'}</p>
          <p><strong>Fecha:</strong> {cls.starts_at ? new Date(cls.starts_at).toLocaleString('es-ES') : 'Sin fecha'}</p>
          <p><strong>Estado:</strong> {cls.status}</p>
        </CardContent>
      </Card>
    </div>
  );
}
