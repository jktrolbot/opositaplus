'use client';

import { useEffect, useState } from 'react';
import { Loader2, Search, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOrganization } from '@/lib/hooks/use-organization';
import { InviteStudentDialog } from '@/components/centro/invite-student-dialog';
import { getStudents, inviteStudent } from '@/lib/actions/students';

interface StudentRow {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  user_profiles: { full_name: string | null; avatar_url: string | null; phone: string | null } | null;
}

export default function AlumnosPage() {
  const { organization, userRole, isLoading: orgLoading } = useOrganization();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);

  useEffect(() => {
    if (!organization) return;
    setLoading(true);
    getStudents(organization.id)
      .then((data) => setStudents((data ?? []) as unknown as StudentRow[]))
      .finally(() => setLoading(false));
  }, [organization]);

  if (orgLoading || loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#1B3A5C]" />
      </div>
    );
  }

  if (userRole !== 'center_admin' && userRole !== 'super_admin') {
    return <p className="text-slate-500">No tienes acceso a esta sección.</p>;
  }

  const filtered = students.filter((s) => {
    const name = s.user_profiles?.full_name ?? '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B3A5C]">Alumnos</h1>
          <p className="text-sm text-slate-500">{students.length} alumnos registrados</p>
        </div>
        <Button className="bg-[#1B3A5C] text-white hover:bg-[#16314d]" onClick={() => setInviteOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Invitar alumno
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          className="pl-9"
          placeholder="Buscar alumnos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-slate-500">Lista de alumnos</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-sm text-slate-500">No hay alumnos{search ? ' que coincidan con la búsqueda' : ''}.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((student) => (
                <div key={student.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-slate-900">
                      {student.user_profiles?.full_name ?? 'Sin nombre'}
                    </p>
                    <p className="text-sm text-slate-500">
                      Desde {new Date(student.joined_at).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <a
                    href={`alumnos/${student.user_id}`}
                    className="text-sm font-medium text-[#1B3A5C] hover:underline"
                  >
                    Ver perfil
                  </a>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <InviteStudentDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={async (email) => {
          if (organization) {
            await inviteStudent(organization.id, email);
          }
        }}
      />
    </div>
  );
}
