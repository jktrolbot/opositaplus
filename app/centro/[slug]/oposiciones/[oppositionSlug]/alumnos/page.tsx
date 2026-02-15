'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { Loader2, Search, UserPlus } from 'lucide-react';
import { AuthGuard } from '@/components/auth-guard';
import { InviteStudentDialog } from '@/components/centro/invite-student-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { getStudents, inviteStudent } from '@/lib/actions/students';
import { useCenterOpposition } from '../use-center-opposition';

type StudentRow = {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  user_profiles: { full_name: string | null; avatar_url: string | null; phone: string | null } | null;
};

export default function OppositionStudentsPage({
  params,
}: {
  params: Promise<{ slug: string; oppositionSlug: string }>;
}) {
  const { slug, oppositionSlug } = use(params);
  const { organization, opposition, isLoading: contextLoading, error: contextError } =
    useCenterOpposition(oppositionSlug);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [progressCountByStudent, setProgressCountByStudent] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!organization || !opposition) return;
    const currentOrganization = organization;
    const currentOpposition = opposition;
    const supabase = createClient();

    async function load() {
      setLoading(true);
      const studentsRows = ((await getStudents(currentOrganization.id)) ?? []) as StudentRow[];

      const { data: progressRows } = await supabase
        .from('student_progress')
        .select('student_id')
        .eq('center_id', currentOrganization.id)
        .eq('oposicion_id', currentOpposition.id);

      const counts: Record<string, number> = {};
      for (const row of progressRows ?? []) {
        counts[row.student_id] = (counts[row.student_id] ?? 0) + 1;
      }

      setStudents(studentsRows);
      setProgressCountByStudent(counts);
      setLoading(false);
    }

    load().catch(() => setLoading(false));
  }, [opposition, organization]);

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return students;
    return students.filter((student) =>
      (student.user_profiles?.full_name ?? '').toLowerCase().includes(term),
    );
  }, [search, students]);

  const activeInOpposition = useMemo(
    () => students.filter((student) => (progressCountByStudent[student.user_id] ?? 0) > 0).length,
    [progressCountByStudent, students],
  );

  return (
    <AuthGuard
      allowedRoles={['centro_admin', 'super_admin']}
      resource="center"
      action="manage"
      fallbackPath={`/centro/${slug}/oposiciones/${oppositionSlug}`}
    >
      {contextLoading || loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#1B3A5C]" />
        </div>
      ) : contextError ? (
        <p className="text-sm text-slate-500">{contextError}</p>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[#1B3A5C]">Alumnos matriculados</h2>
              <p className="text-sm text-slate-500">
                {students.length} en el centro · {activeInOpposition} con actividad en {opposition?.name}
              </p>
            </div>
            <Button
              className="bg-[#1B3A5C] text-white hover:bg-[#16314d]"
              onClick={() => setInviteOpen(true)}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Invitar alumno
            </Button>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-9"
              placeholder="Buscar alumnos..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-500">Listado</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredStudents.length === 0 ? (
                <p className="text-sm text-slate-500">No hay alumnos para la búsqueda indicada.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredStudents.map((student) => {
                    const progressCount = progressCountByStudent[student.user_id] ?? 0;
                    return (
                      <div key={student.id} className="flex items-center justify-between py-3">
                        <div>
                          <p className="font-medium text-slate-900">
                            {student.user_profiles?.full_name ?? 'Sin nombre'}
                          </p>
                          <p className="text-xs text-slate-500">
                            Desde {new Date(student.joined_at).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              progressCount > 0
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {progressCount > 0
                              ? `${progressCount} repasos registrados`
                              : 'Sin actividad aún'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <InviteStudentDialog
            open={inviteOpen}
            onClose={() => setInviteOpen(false)}
            onInvite={async (email) => {
              if (!organization) return;
              await inviteStudent(organization.id, email);
            }}
          />
        </div>
      )}
    </AuthGuard>
  );
}
