'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { getSettlements } from '@/lib/actions/settlements';

interface Settlement {
  id: string;
  period_start: string;
  period_end: string;
  total_revenue_cents: number;
  commission_cents: number;
  net_amount_cents: number;
  status: string;
  organizations: { name: string } | null;
}

export default function AdminLiquidacionesPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSettlements().then((data) => {
      setSettlements((data ?? []) as unknown as Settlement[]);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#1B3A5C]" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#1B3A5C]">Liquidaciones</h1>
      {settlements.length === 0 ? (
        <p className="text-sm text-slate-500">No hay liquidaciones registradas.</p>
      ) : (
        <div className="space-y-3">
          {settlements.map((s) => (
            <Card key={s.id} className="border-slate-200">
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium text-slate-900">{s.organizations?.name ?? 'Centro'}</p>
                  <p className="text-sm text-slate-500">{s.period_start} — {s.period_end}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-[#1B3A5C]">{(s.net_amount_cents / 100).toFixed(2)}€</p>
                  <span className={`text-xs ${s.status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>{s.status}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
