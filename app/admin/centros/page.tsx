'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';

export default function AdminCentrosPage() {
  const [orgs, setOrgs] = useState<{ id: string; name: string; slug: string; status: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.from('organizations').select('id, name, slug, status').order('name').then(({ data }) => {
      setOrgs((data ?? []) as typeof orgs);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#1B3A5C]" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#1B3A5C]">Centros</h1>
      <div className="space-y-3">
        {orgs.map((org) => (
          <Card key={org.id} className="border-slate-200">
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="font-medium text-slate-900">{org.name}</p>
                <p className="text-sm text-slate-500">/{org.slug}</p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs ${org.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {org.status}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
