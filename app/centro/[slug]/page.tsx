'use client';

import { BookOpen, Calendar, GraduationCap, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOrganization } from '@/lib/hooks/use-organization';
import { normalizeRole } from '@/lib/auth/roles';
import { Loader2 } from 'lucide-react';

export default function CentroDashboard() {
  const { organization, userRole, isLoading, error } = useOrganization();
  const normalizedRole = normalizeRole(userRole);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#1B3A5C]" />
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-slate-500">{error ?? 'Centro no encontrado'}</p>
      </div>
    );
  }

  const stats = [
    { label: 'Alumnos', value: '—', icon: Users },
    { label: 'Oposiciones', value: '—', icon: BookOpen },
    { label: 'Clases esta semana', value: '—', icon: Calendar },
    { label: 'Tests realizados', value: '—', icon: GraduationCap },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1B3A5C]">Dashboard</h1>
        <p className="text-sm text-slate-500">
          Bienvenido a {organization.name}
          {normalizedRole &&
            ` · ${
              normalizedRole === 'centro_admin'
                ? 'Administrador'
                : normalizedRole === 'profesor'
                  ? 'Profesor'
                  : normalizedRole === 'alumno'
                    ? 'Alumno'
                    : 'Super Admin'
            }`}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">{stat.label}</CardTitle>
              <stat.icon className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-[#1B3A5C]">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg text-[#1B3A5C]">Actividad reciente</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">No hay actividad reciente.</p>
        </CardContent>
      </Card>
    </div>
  );
}
