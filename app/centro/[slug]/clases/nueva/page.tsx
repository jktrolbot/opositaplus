'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOrganization } from '@/lib/hooks/use-organization';
import { useAuth } from '@/lib/auth-context';
import { createClass } from '@/lib/100ms/actions';

export default function NuevaClasePage() {
  const router = useRouter();
  const { organization } = useOrganization();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [type, setType] = useState('live');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !user) return;
    setLoading(true);
    setError('');

    try {
      await createClass({
        organization_id: organization.id,
        opposition_id: '', // TODO: select opposition
        title,
        description,
        type,
        starts_at: new Date(startsAt).toISOString(),
        teacher_id: user.id,
      });
      router.push(`/centro/${organization.slug}/clases`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la clase');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-[#1B3A5C]">Nueva clase</h1>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg">Detalles de la clase</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="starts_at">Fecha y hora</Label>
              <Input id="starts_at" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="live">En directo</option>
                <option value="recorded">Grabada</option>
                <option value="hybrid">Híbrida</option>
              </select>
            </div>

            {error && (
              <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
            )}

            <Button type="submit" className="w-full bg-[#1B3A5C] text-white hover:bg-[#16314d]" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Crear clase
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
