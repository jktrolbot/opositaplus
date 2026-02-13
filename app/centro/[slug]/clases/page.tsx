'use client';

import { useEffect, useState } from 'react';
import { Calendar, Loader2, Plus, Video } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOrganization } from '@/lib/hooks/use-organization';
import { createClient } from '@/lib/supabase/client';

interface ClassRow {
  id: string;
  title: string;
  description: string | null;
  type: string;
  starts_at: string | null;
  status: string;
}

export default function ClasesPage() {
  const { organization, userRole, isLoading: orgLoading } = useOrganization();
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organization) return;
    const supabase = createClient();
    supabase
      .from('classes')
      .select('*')
      .eq('organization_id', organization.id)
      .order('starts_at', { ascending: true })
      .then(({ data }) => {
        setClasses((data ?? []) as unknown as ClassRow[]);
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
  const canCreate = userRole === 'center_admin' || userRole === 'teacher' || userRole === 'super_admin';

  const statusLabels: Record<string, string> = {
    scheduled: '📅 Programada',
    live: '🔴 En directo',
    completed: '✅ Completada',
    cancelled: '❌ Cancelada',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B3A5C]">Clases</h1>
          <p className="text-sm text-slate-500">{classes.length} clases</p>
        </div>
        {canCreate && (
          <Link href={`/centro/${slug}/clases/nueva`}>
            <Button className="bg-[#1B3A5C] text-white hover:bg-[#16314d]">
              <Plus className="mr-2 h-4 w-4" />
              Nueva clase
            </Button>
          </Link>
        )}
      </div>

      {classes.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="py-10 text-center">
            <Calendar className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-2 text-sm text-slate-500">No hay clases programadas.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {classes.map((cls) => (
            <Link key={cls.id} href={`/centro/${slug}/clases/${cls.id}`}>
              <Card className="border-slate-200 transition hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Video className="h-4 w-4 text-[#1B3A5C]" />
                      {cls.title}
                    </CardTitle>
                    <span className="text-xs text-slate-500">{statusLabels[cls.status] ?? cls.status}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-500">
                    {cls.starts_at ? new Date(cls.starts_at).toLocaleString('es-ES') : 'Sin fecha'}
                    {' · '}{cls.type === 'live' ? 'En directo' : cls.type === 'recorded' ? 'Grabada' : 'Híbrida'}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
