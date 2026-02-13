'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';

export default function AdminOposicionesPage() {
  const [oppositions, setOppositions] = useState<{ id: string; name: string; slug: string; difficulty_level: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.from('oppositions').select('id, name, slug, difficulty_level').order('name').then(({ data }) => {
      setOppositions((data ?? []) as typeof oppositions);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#1B3A5C]" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#1B3A5C]">Oposiciones</h1>
      <div className="space-y-3">
        {oppositions.map((o) => (
          <Card key={o.id} className="border-slate-200">
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="font-medium text-slate-900">{o.name}</p>
                <p className="text-sm text-slate-500">/{o.slug}</p>
              </div>
              <span className="text-sm text-slate-400">Dificultad: {o.difficulty_level}/5</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
