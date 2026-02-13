'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useOrganization } from '@/lib/hooks/use-organization';
import { PricingCard } from '@/components/centro/pricing-card';
import { createCheckoutSession } from '@/lib/stripe/actions';
import { createClient } from '@/lib/supabase/client';

interface PlanRow {
  id: string;
  name: string;
  description: string | null;
  type: string;
  price_cents: number;
  currency: string;
  features: string[];
  trial_days: number;
  is_active: boolean;
}

export default function PlanesPage() {
  const { organization, isLoading: orgLoading } = useOrganization();
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organization) return;
    const supabase = createClient();
    supabase
      .from('plans')
      .select('*')
      .eq('organization_id', organization.id)
      .eq('is_active', true)
      .order('price_cents')
      .then(({ data }) => {
        setPlans((data ?? []) as unknown as PlanRow[]);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1B3A5C]">Planes y Precios</h1>
        <p className="text-sm text-slate-500">Elige el plan que mejor se adapte a tus necesidades</p>
      </div>

      {plans.length === 0 ? (
        <p className="text-sm text-slate-500">No hay planes disponibles.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <PricingCard
              key={plan.id}
              name={plan.name}
              description={plan.description}
              priceCents={plan.price_cents}
              currency={plan.currency}
              type={plan.type}
              features={plan.features}
              trialDays={plan.trial_days}
              onSubscribe={async () => {
                if (!organization) return;
                const { url } = await createCheckoutSession(plan.id, organization.id);
                if (url) window.location.href = url;
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
