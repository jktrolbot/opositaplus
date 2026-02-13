'use client';

import { useEffect, useState } from 'react';
import { Building, CreditCard, Loader2, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAdminStats } from '@/lib/actions/settlements';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalOrgs: 0, totalMembers: 0, totalRevenueCents: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminStats().then((s) => { setStats(s); setLoading(false); });
  }, []);

  if (loading) {
    return <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#1B3A5C]" /></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#1B3A5C]">Panel Super Admin</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Centros</CardTitle>
            <Building className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-[#1B3A5C]">{stats.totalOrgs}</p></CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Usuarios</CardTitle>
            <Users className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-[#1B3A5C]">{stats.totalMembers}</p></CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Ingresos totales</CardTitle>
            <CreditCard className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-[#1B3A5C]">{(stats.totalRevenueCents / 100).toFixed(2)}€</p></CardContent>
        </Card>
      </div>
    </div>
  );
}
