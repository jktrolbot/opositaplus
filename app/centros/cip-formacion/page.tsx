import Link from 'next/link';
import { MapPin, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { centros, oposiciones } from '@/data/oposiciones';

export default function CipFormacionPage() {
  const cip = centros.find((centro) => centro.slug === 'cip-formacion') ?? centros[0];
  const validatedOposiciones = oposiciones.filter((oposicion) => oposicion.centro.slug === cip.slug);

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="mx-auto max-w-6xl px-4 py-8">
        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-3xl text-[#1B3A5C]">{cip.name}</CardTitle>
            <CardDescription>{cip.fullName}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-700">{cip.description}</p>
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="outline">Fundado en {cip.founded}</Badge>
              <Badge variant="outline">
                <MapPin className="mr-1 h-3 w-3" />
                {cip.location}
              </Badge>
              {cip.certifications.map((certification) => (
                <Badge key={certification} variant="outline">
                  {certification}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <section className="mt-8">
          <h2 className="mb-4 text-2xl font-bold text-[#1B3A5C]">Oposiciones validadas por CIP Formación</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {validatedOposiciones.map((oposicion) => (
              <Card key={oposicion.slug} className="border-slate-200 bg-white">
                <CardHeader>
                  <div className="mb-2 inline-flex items-center gap-2 text-sm text-emerald-800">
                    <ShieldCheck className="h-4 w-4" />
                    Validada por CIP Formación
                  </div>
                  <CardTitle className="text-xl text-[#1B3A5C]">{oposicion.shortName}</CardTitle>
                  <CardDescription>
                    {oposicion.category} · {oposicion.totalQuestions} preguntas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={`/oposiciones/${oposicion.slug}`}>
                    <Button className="w-full bg-[#1B3A5C] text-white hover:bg-[#16314d]">Ver oposición</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
