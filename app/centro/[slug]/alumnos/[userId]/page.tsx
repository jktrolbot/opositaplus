'use client';

import { use, useEffect, useState } from 'react';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOrganization } from '@/lib/hooks/use-organization';
import { getStudentProfile } from '@/lib/actions/students';

export default function StudentProfilePage({
  params,
}: {
  params: Promise<{ slug: string; userId: string }>;
}) {
  const { slug, userId } = use(params);
  const { organization, isLoading: orgLoading } = useOrganization();
  const [profile, setProfile] = useState<{ member: unknown; profile: { full_name: string | null } | null; progress: unknown[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organization) return;
    getStudentProfile(organization.id, userId)
      .then((data) => setProfile(data as typeof profile))
      .finally(() => setLoading(false));
  }, [organization, userId]);

  if (orgLoading || loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#1B3A5C]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href={`/centro/${slug}/alumnos`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" />
        Volver a alumnos
      </Link>

      <h1 className="text-2xl font-bold text-[#1B3A5C]">
        {profile?.profile?.full_name ?? 'Alumno'}
      </h1>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">Progreso</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">
              {(profile?.progress as unknown[])?.length ?? 0} temas en progreso
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">Tests realizados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-[#1B3A5C]">—</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
