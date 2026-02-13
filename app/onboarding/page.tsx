'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Building, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createOrganization, linkOppositions, getAvailableOppositions } from '@/lib/actions/onboarding';
import { useEffect } from 'react';

const STEPS = [
  'Datos del centro',
  'Contacto',
  'Oposiciones',
  'Planes',
  'Contenido',
  'Equipo',
  'Confirmación',
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedOppositions, setSelectedOppositions] = useState<string[]>([]);
  const [availableOppositions, setAvailableOppositions] = useState<{ id: string; name: string }[]>([]);
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    getAvailableOppositions().then((data) => {
      setAvailableOppositions((data ?? []).map((o: { id: string; name: string }) => ({ id: o.id, name: o.name })));
    });
  }, []);

  const handleNameChange = (value: string) => {
    setName(value);
    setSlug(value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
  };

  const handleNext = async () => {
    setError('');

    if (step === 0 && (!name || !slug)) {
      setError('Nombre y slug son obligatorios');
      return;
    }

    if (step === 1) {
      // Create org
      setLoading(true);
      try {
        const org = await createOrganization({ name, slug, description, website, contact_email: email, contact_phone: phone });
        setOrgId(org.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al crear centro');
        setLoading(false);
        return;
      }
      setLoading(false);
    }

    if (step === 2 && orgId && selectedOppositions.length > 0) {
      setLoading(true);
      try {
        await linkOppositions(orgId, selectedOppositions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error');
      }
      setLoading(false);
    }

    if (step === STEPS.length - 1) {
      router.push(`/centro/${slug}`);
      return;
    }

    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#eef4fb_0%,#f8fafc_25%,#f8fafc_100%)]">
      <section className="mx-auto max-w-2xl px-4 py-10">
        <div className="mb-8 text-center">
          <Building className="mx-auto h-10 w-10 text-[#1B3A5C]" />
          <h1 className="mt-3 text-2xl font-bold text-[#1B3A5C]">Registrar centro</h1>
          <p className="text-sm text-slate-500">Paso {step + 1} de {STEPS.length}: {STEPS[step]}</p>
        </div>

        {/* Progress */}
        <div className="mb-8 flex gap-1">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-[#1B3A5C]' : 'bg-slate-200'}`} />
          ))}
        </div>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg text-[#1B3A5C]">{STEPS[step]}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 0 && (
              <>
                <div className="space-y-2">
                  <Label>Nombre del centro</Label>
                  <Input value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="Mi Centro de Formación" required />
                </div>
                <div className="space-y-2">
                  <Label>Slug (URL)</Label>
                  <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="mi-centro" />
                  <p className="text-xs text-slate-400">opositaplus.es/centros/{slug || '...'}</p>
                </div>
                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Breve descripción del centro" />
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label>Sitio web</Label>
                  <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://micentro.es" />
                </div>
                <div className="space-y-2">
                  <Label>Email de contacto</Label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="info@micentro.es" type="email" />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+34 600 000 000" />
                </div>
              </>
            )}

            {step === 2 && (
              <div className="space-y-2">
                <p className="text-sm text-slate-500">Selecciona las oposiciones que ofreces:</p>
                {availableOppositions.map((o) => (
                  <label key={o.id} className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={selectedOppositions.includes(o.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedOppositions([...selectedOppositions, o.id]);
                        } else {
                          setSelectedOppositions(selectedOppositions.filter((id) => id !== o.id));
                        }
                      }}
                    />
                    {o.name}
                  </label>
                ))}
              </div>
            )}

            {step === 3 && (
              <p className="text-sm text-slate-500">Los planes se pueden configurar desde el panel de administración del centro una vez completado el registro.</p>
            )}

            {step === 4 && (
              <p className="text-sm text-slate-500">Podrás subir contenido (temas, PDFs, vídeos) desde el panel de contenido del centro.</p>
            )}

            {step === 5 && (
              <p className="text-sm text-slate-500">Invita a profesores y alumnos desde la sección de gestión del centro.</p>
            )}

            {step === 6 && (
              <div className="space-y-3 text-center">
                <Check className="mx-auto h-12 w-12 text-emerald-500" />
                <p className="font-medium text-slate-900">¡Centro registrado correctamente!</p>
                <p className="text-sm text-slate-500">Tu centro está pendiente de revisión. Puedes empezar a configurarlo mientras tanto.</p>
              </div>
            )}

            {error && (
              <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
            )}

            <div className="flex gap-2 pt-2">
              {step > 0 && (
                <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Anterior
                </Button>
              )}
              <Button className="ml-auto bg-[#1B3A5C] text-white hover:bg-[#16314d]" onClick={handleNext} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {step === STEPS.length - 1 ? 'Ir al centro' : (
                  <>
                    Siguiente
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
