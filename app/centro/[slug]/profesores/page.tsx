'use client';

import { useEffect, useState } from 'react';
import { Loader2, Search, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOrganization } from '@/lib/hooks/use-organization';
import { getTeachers } from '@/lib/actions/content';

interface TeacherRow {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  user_profiles: { full_name: string | null; avatar_url: string | null } | null;
}

export default function ProfesoresPage() {
  const { organization, userRole, isLoading: orgLoading } = useOrganization();
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!organization) return;
    getTeachers(organization.id)
      .then((data) => setTeachers((data ?? []) as unknown as TeacherRow[]))
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

  const filtered = teachers.filter((t) => {
    const name = t.user_profiles?.full_name ?? '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B3A5C]">Profesores</h1>
          <p className="text-sm text-slate-500">{teachers.length} profesores</p>
        </div>
        <Button className="bg-[#1B3A5C] text-white hover:bg-[#16314d]">
          <UserPlus className="mr-2 h-4 w-4" />
          Añadir profesor
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input className="pl-9" placeholder="Buscar profesores..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-slate-500">Equipo docente</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-sm text-slate-500">No hay profesores registrados.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((teacher) => (
                <div key={teacher.id} className="flex items-center justify-between py-3">
                  <p className="font-medium text-slate-900">{teacher.user_profiles?.full_name ?? 'Sin nombre'}</p>
                  <span className="text-sm text-slate-500">Desde {new Date(teacher.joined_at).toLocaleDateString('es-ES')}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
