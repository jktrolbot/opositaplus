'use client';

import { use } from 'react';
import dynamic from 'next/dynamic';
import { ArrowLeft, ExternalLink, Video } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const HmsRoom = dynamic(() => import('@/components/hms-room'), { ssr: false });

interface ClassData {
  id: string;
  meeting_provider: string | null;
  meeting_id: string | null;
  meeting_url: string | null;
  title: string;
}

export default function SalaPage({
  params,
}: {
  params: Promise<{ slug: string; classId: string }>;
}) {
  const { slug, classId } = use(params);
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('classes')
      .select('id, meeting_provider, meeting_id, meeting_url, title')
      .eq('id', classId)
      .single()
      .then(({ data }) => {
        setClassData(data);
        setLoading(false);
      });
  }, [classId]);

  const isExternal = classData?.meeting_provider && classData.meeting_provider !== '100ms';

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-2">
        <Link href={`/centro/${slug}/clases/${classId}`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>
        {classData && <span className="ml-2 text-sm font-medium">{classData.title}</span>}
      </div>

      <div className="flex flex-1 items-center justify-center bg-slate-900">
        {loading ? (
          <p className="text-white">Cargando...</p>
        ) : isExternal && classData?.meeting_url ? (
          <Card className="border-slate-700 bg-slate-800">
            <CardContent className="py-10 text-center">
              <Video className="mx-auto h-16 w-16 text-blue-400" />
              <p className="mt-4 text-lg font-medium text-white">Clase en {classData.meeting_provider}</p>
              <p className="mt-2 text-sm text-slate-400">
                Esta clase se imparte en una plataforma externa.
              </p>
              <Button asChild className="mt-4" variant="outline">
                <a href={classData.meeting_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Abrir en {classData.meeting_provider}
                </a>
              </Button>
            </CardContent>
          </Card>
        ) : classData?.meeting_id ? (
          <HmsRoom roomId={classData.meeting_id} authToken={null} />
        ) : (
          <Card className="border-slate-700 bg-slate-800">
            <CardContent className="py-10 text-center">
              <Video className="mx-auto h-16 w-16 text-slate-500" />
              <p className="mt-4 text-lg font-medium text-white">Sala de clase en directo</p>
              <p className="mt-2 text-sm text-slate-400">
                No se ha configurado ninguna sala para esta clase.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
