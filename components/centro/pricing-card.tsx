'use client';

import { Check, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PricingCardProps {
  name: string;
  description: string | null;
  priceCents: number;
  currency: string;
  type: string;
  features: string[];
  trialDays: number;
  onSubscribe: () => Promise<void>;
  isCurrentPlan?: boolean;
}

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

const typeLabels: Record<string, string> = {
  monthly: '/mes',
  quarterly: '/trimestre',
  annual: '/año',
  one_time: '',
};

export function PricingCard({
  name,
  description,
  priceCents,
  currency,
  type,
  features,
  trialDays,
  onSubscribe,
  isCurrentPlan,
}: PricingCardProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await onSubscribe();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-slate-200 transition hover:shadow-md">
      <CardHeader>
        <CardTitle className="text-lg text-[#1B3A5C]">{name}</CardTitle>
        {description && <p className="text-sm text-slate-500">{description}</p>}
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <span className="text-3xl font-bold text-[#1B3A5C]">{formatPrice(priceCents, currency)}</span>
          <span className="text-sm text-slate-500">{typeLabels[type] ?? ''}</span>
        </div>

        {trialDays > 0 && (
          <p className="text-sm text-emerald-600">{trialDays} días de prueba gratis</p>
        )}

        <ul className="space-y-2">
          {features.map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-sm text-slate-600">
              <Check className="h-4 w-4 text-emerald-500" />
              {feature}
            </li>
          ))}
        </ul>

        <Button
          className="w-full bg-[#1B3A5C] text-white hover:bg-[#16314d]"
          disabled={loading || isCurrentPlan}
          onClick={handleClick}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : isCurrentPlan ? (
            'Plan actual'
          ) : (
            'Suscribirse'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
