'use client';

import { use, useEffect, useState } from 'react';
import { ArrowLeft, Loader2, MapPin, Star } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';

interface OrgDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  website: string | null;
  contact_email: string | null;
}

interface PlanRow {
  id: string;
  name: string;
  price_cents: number;
  type: string;
  oppositions: { name: string } | null;
}

export default function CentroPublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [org, setOrg] = useState<OrgDetail | null>(null);
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    Promise.all([
      supabase.from('organizations').select('*').eq('slug', slug).single(),
      supabase.from('plans').select('*, oppositions(name)').eq('is_active', true),
    ]).then(([orgResult, plansResult]) => {
      setOrg(orgResult.data as unknown as OrgDetail);
      // Filter plans by org
      const orgPlans = (plansResult.data ?? []).filter(
        (p: { organization_id?: string }) => p.organization_id === orgResult.data?.id
      );
      setPlans(orgPlans as unknown as PlanRow[]);
      setLoading(false);
    });
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#1B3A5C]" />
      </div>
    );
  }

  if (!org) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-slate-500">Centro no encontrado.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#eef4fb_0%,#f8fafc_25%,#f8fafc_100%)]">
      <section className="mx-auto max-w-4xl px-4 py-10">
        <Link href="/centros" className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft className="h-4 w-4" />
          Todos los centros
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1B3A5C]">{org.name}</h1>
          <div className="mt-2 flex items-center gap-3 text-sm text-slate-500">
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> España</span>
            <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-amber-400" /> 4.8</span>
          </div>
          {org.description && <p className="mt-4 text-slate-600">{org.description}</p>}
        </div>

        {plans.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-bold text-[#1B3A5C]">Planes disponibles</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {plans.map((plan) => (
                <Card key={plan.id} className="border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-base">{plan.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-[#1B3A5C]">
                      {(plan.price_cents / 100).toFixed(0)}€
                      <span className="text-sm font-normal text-slate-500">/{plan.type === 'monthly' ? 'mes' : plan.type === 'quarterly' ? 'trim.' : 'año'}</span>
                    </p>
                    <Link href={`/centro/${slug}`}>
                      <Button className="mt-3 w-full bg-[#1B3A5C] text-white hover:bg-[#16314d]">
                        Ver más
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {org.contact_email && (
          <Card className="border-slate-200">
            <CardContent className="py-4">
              <p className="text-sm text-slate-500">Contacto: <a href={`mailto:${org.contact_email}`} className="text-[#1B3A5C] hover:underline">{org.contact_email}</a></p>
            </CardContent>
          </Card>
        )}
      </section>
    </main>
  );
}
