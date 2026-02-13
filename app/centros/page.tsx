'use client';

import { useEffect, useState } from 'react';
import { Loader2, MapPin, Search } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';

interface OrgRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
}

export default function CentrosPage() {
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('organizations')
      .select('id, name, slug, description, logo_url')
      .eq('status', 'active')
      .order('name')
      .then(({ data }) => {
        setOrgs((data ?? []) as OrgRow[]);
        setLoading(false);
      });
  }, []);

  const filtered = orgs.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#eef4fb_0%,#f8fafc_25%,#f8fafc_100%)]">
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-[#1B3A5C]">Centros de formación</h1>
          <p className="mt-2 text-slate-500">Encuentra tu centro de oposiciones ideal</p>
        </div>

        <div className="mx-auto mb-8 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input className="pl-9" placeholder="Buscar centros..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-[#1B3A5C]" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-slate-500">No se encontraron centros.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((org) => (
              <Link key={org.id} href={`/centros/${org.slug}`}>
                <Card className="border-slate-200 transition hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg text-[#1B3A5C]">{org.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-500 line-clamp-2">{org.description ?? 'Centro de formación para oposiciones'}</p>
                    <div className="mt-3 flex items-center gap-1 text-xs text-slate-400">
                      <MapPin className="h-3 w-3" />
                      España
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
