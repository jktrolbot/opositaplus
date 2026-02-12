import Link from 'next/link';
import { ShieldCheck, CheckCircle2, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { categories, centros } from '@/data/oposiciones';

const plans = [
  {
    name: 'Demo CIP',
    price: '0 EUR',
    period: 'acceso de demostración',
    features: [
      'Catálogo de oposiciones por categoría',
      'Tests por oposición y temario',
      'Panel de progreso por convocatoria',
    ],
    cta: 'Ver oposiciones',
    href: '/oposiciones',
    highlighted: false,
  },
  {
    name: 'Pro Opositor',
    price: '19 EUR',
    period: 'al mes',
    features: [
      'Tests adaptativos ilimitados',
      'Preparador personal por oposición',
      'Planificador y simulacros completos',
      'Repaso inteligente por errores',
    ],
    cta: 'Comenzar plan Pro',
    href: '/oposiciones',
    highlighted: true,
  },
  {
    name: 'Academia',
    price: 'Custom',
    period: 'licencia de centro',
    features: [
      'Branding de centro formativo',
      'Seguimiento por grupos y tutores',
      'Contenido validado y trazable',
    ],
    cta: 'Hablar con equipo',
    href: '/centros/cip-formacion',
    highlighted: false,
  },
];

export default function HomePage() {
  const cip = centros[0];

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#eef4fb_0%,#f8fafc_18%,#f8fafc_100%)]">
      <section className="mx-auto max-w-6xl px-4 pb-12 pt-10 text-center sm:pt-14">
        <Badge className="mb-5 border border-emerald-200 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
          <ShieldCheck className="mr-1 h-3 w-3" />
          Validado por CIP Formación
        </Badge>
        <h1 className="mx-auto max-w-4xl text-balance text-4xl font-bold tracking-tight text-[#1B3A5C] sm:text-5xl">
          Prepárate para tu oposición con las mejores herramientas
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-pretty text-base text-slate-600 sm:text-lg">
          Entrena por categoría y por convocatoria con tests, planificación y seguimiento real de progreso.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/oposiciones">
            <Button size="lg" className="bg-[#1B3A5C] text-white hover:bg-[#16314d]">
              Explorar oposiciones
            </Button>
          </Link>
          <Link href="/centros/cip-formacion">
            <Button size="lg" variant="outline">
              Ver centro validador
            </Button>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#1B3A5C]">Categorías de oposición</h2>
          <p className="mt-1 text-sm text-slate-600">Navega por bloques y accede a cada oposición con su temario y herramientas.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {categories.map((category) => (
            <Card key={category.name} className="border-slate-200 bg-white">
              <CardHeader>
                <div className="text-3xl" aria-hidden>
                  {category.icon}
                </div>
                <CardTitle className="text-[#1B3A5C]">{category.name}</CardTitle>
                <CardDescription>{category.count} oposiciones activas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Badge variant="outline">Validado por CIP Formación</Badge>
                <Link href={`/oposiciones?category=${encodeURIComponent(category.name)}`}>
                  <Button variant="outline" className="w-full">
                    Ver categoría
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <Card className="border-emerald-200 bg-white">
          <CardHeader>
            <CardTitle className="text-[#1B3A5C]">Centros que respaldan nuestro contenido</CardTitle>
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
              {cip.certifications.map((cert) => (
                <Badge key={cert} variant="outline">
                  {cert}
                </Badge>
              ))}
            </div>
            <Link href="/centros/cip-formacion">
              <Button className="bg-[#10B981] text-white hover:bg-emerald-600">Ver perfil del centro</Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <h2 className="text-center text-2xl font-bold text-[#1B3A5C]">Planes</h2>
        <p className="mt-2 text-center text-sm text-slate-600">Modelos de uso para opositor individual y academias.</p>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={plan.highlighted ? 'border-[#1B3A5C] bg-[#1B3A5C] text-white' : 'border-slate-200 bg-white'}
            >
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription className={plan.highlighted ? 'text-slate-200' : ''}>{plan.period}</CardDescription>
                <p className="text-3xl font-bold">{plan.price}</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href={plan.href}>
                  <Button
                    className={`mt-6 w-full ${
                      plan.highlighted ? 'bg-white text-[#1B3A5C] hover:bg-slate-100' : 'bg-[#1B3A5C] text-white hover:bg-[#16314d]'
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-4xl px-4 pb-16">
        <h2 className="text-center text-2xl font-bold text-[#1B3A5C]">Preguntas frecuentes</h2>
        <Accordion type="single" collapsible className="mt-8">
          <AccordionItem value="faq-1">
            <AccordionTrigger>¿Cómo funciona la navegación por categorías?</AccordionTrigger>
            <AccordionContent>
              Puedes entrar por Xunta de Galicia, Hacienda y Finanzas, Administración General o Justicia y después elegir
              la oposición concreta.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="faq-2">
            <AccordionTrigger>¿El contenido está validado por un centro?</AccordionTrigger>
            <AccordionContent>
              Sí. El contenido de las oposiciones incluidas está validado por CIP Formación, centro con sede en Vigo y
              certificaciones ISO 9001, ISO 14001 e ISO 27001.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="faq-3">
            <AccordionTrigger>¿Puedo estudiar desde móvil?</AccordionTrigger>
            <AccordionContent>
              Sí. La experiencia está optimizada para móvil y escritorio, incluyendo tests, simulacros y seguimiento.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>
    </main>
  );
}
