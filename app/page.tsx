import Link from 'next/link';
import { Building2, CheckCircle2, GraduationCap, MapPin, School, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { centros } from '@/data/oposiciones';

const plans = [
  {
    name: 'Starter Opositor',
    price: '0 EUR',
    period: 'plan gratuito',
    features: [
      'Catálogo de oposiciones por categoría',
      'Tests por oposición y temario',
      'Panel de progreso por convocatoria',
    ],
    cta: 'Ver demo Knowledge Base',
    href: '/demo',
    highlighted: false,
  },
  {
    name: 'Pro Opositor',
    price: '19 EUR',
    period: 'al mes',
    features: [
      'Tests adaptativos ilimitados',
      'Preparador personal por oposicion',
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
    href: '/registro-centro',
    highlighted: false,
  },
];

const audiences = [
  {
    title: 'ALUMNO',
    description: 'Tests adaptativos, tutor IA, planificador, simulacros y repaso inteligente.',
    icon: UserRound,
    features: ['Tests adaptativos', 'Tutor IA', 'Planificador', 'Simulacros', 'Repaso inteligente'],
  },
  {
    title: 'CENTRO',
    description: 'Automatiza operaciones academicas y escala con IA sobre tu contenido propio.',
    icon: Building2,
    features: ['Gestión de alumnos', 'Contenido validado', 'Clases en vivo', 'Pipeline IA', 'Dashboard'],
  },
  {
    title: 'PROFESOR',
    description: 'Control pedagógico y trazabilidad real de cada alumno y convocatoria.',
    icon: GraduationCap,
    features: ['Seguimiento por alumno', 'Validación de preguntas', 'Clases programadas'],
  },
];

const howItWorks = [
  { step: '1', title: 'Regístrate', description: 'Crea tu cuenta como opositor o centro en menos de 2 minutos.' },
  { step: '2', title: 'Sube tu material', description: 'Importa PDFs, temas, apuntes y bancos de preguntas.' },
  { step: '3', title: 'La IA hace el resto', description: 'Genera tests, planificación y repaso inteligente automáticamente.' },
];

export default function HomePage() {
  const cip = centros[0];

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#eef4fb_0%,#f8fafc_18%,#f8fafc_100%)]">
      <section className="mx-auto max-w-6xl px-4 pb-14 pt-10 sm:pt-14">
        <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white/90 px-6 py-10 text-center shadow-sm sm:px-12">
          <Badge className="mb-5 border border-emerald-200 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
            <ShieldCheck className="mr-1 h-3 w-3" />
            Plataforma validada por CIP Formación
          </Badge>
          <h1 className="mx-auto max-w-3xl text-balance text-4xl font-bold tracking-tight text-[#1B3A5C] sm:text-5xl">
            La plataforma de preparación para oposiciones que conecta alumnos y academias
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base text-slate-600 sm:text-lg">
            Oposita+ combina entrenamiento adaptativo para opositores con herramientas de gestión y automatización IA para
            centros de formación.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/registro">
              <Button size="lg" className="bg-[#1B3A5C] text-white hover:bg-[#16314d]">
                Soy opositor
              </Button>
            </Link>
            <Link href="/registro-centro">
              <Button size="lg" variant="outline">
                Soy centro / academia
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-[#1B3A5C]">Para quién es Oposita+</h2>
          <p className="mt-1 text-sm text-slate-600">Una sola plataforma para todos los perfiles que participan en la preparación.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {audiences.map((audience) => {
            const Icon = audience.icon;
            return (
              <Card key={audience.title} className="border-slate-200 bg-white">
                <CardHeader>
                  <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#1B3A5C]/10 text-[#1B3A5C]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-[#1B3A5C]">{audience.title}</CardTitle>
                  <CardDescription>{audience.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-slate-700">
                    {audience.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#10B981]" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14">
        <Card className="border-emerald-200 bg-white">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border border-emerald-200 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">CIP Formación</Badge>
              <Badge variant="outline">Partner academico validado</Badge>
            </div>
            <CardTitle className="text-[#1B3A5C]">Prueba social real en formación de oposiciones</CardTitle>
            <CardDescription>{cip.fullName}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm text-slate-700">{cip.description}</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-2xl font-bold text-[#1B3A5C]">35+ anos</p>
                <p className="text-sm text-slate-600">Experiencia formando opositores</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-2xl font-bold text-[#1B3A5C]">ISO certs</p>
                <p className="text-sm text-slate-600">Calidad, medioambiente y seguridad</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-2xl font-bold text-[#1B3A5C]">Vigo</p>
                <p className="text-sm text-slate-600">Sede principal de operaciones</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
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
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-[#1B3A5C]">Cómo funciona</h2>
          <p className="mt-1 text-sm text-slate-600">Empieza rápido sin fricción tecnica.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {howItWorks.map((item) => (
            <Card key={item.step} className="border-slate-200 bg-white">
              <CardHeader>
                <Badge className="w-fit bg-[#1B3A5C] text-white hover:bg-[#1B3A5C]">Paso {item.step}</Badge>
                <CardTitle className="text-[#1B3A5C]">{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-[#1B3A5C]">Planes</h2>
          <p className="mt-2 text-sm text-slate-600">Modelos de uso para opositor individual y academias.</p>
        </div>
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

      <section className="mx-auto max-w-4xl px-4 pb-16">
        <Card className="border-slate-200 bg-[#1B3A5C] text-white">
          <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-emerald-200">¿Eres academia??</p>
              <h3 className="text-xl font-semibold">Escala tu centro con IA y clases en vivo</h3>
            </div>
            <Link href="/para-centros">
              <Button className="bg-[#10B981] text-white hover:bg-emerald-600">
                <School className="mr-2 h-4 w-4" />
                Ver propuesta para centros
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      <section id="faq" className="mx-auto max-w-4xl px-4 pb-16">
        <div className="text-center">
          <Badge className="border border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-100">
            <Sparkles className="mr-1 h-3 w-3" />
            FAQ
          </Badge>
          <h2 className="mt-3 text-2xl font-bold text-[#1B3A5C]">Preguntas frecuentes</h2>
        </div>
        <Accordion type="single" collapsible className="mt-8">
          <AccordionItem value="faq-1">
            <AccordionTrigger>Cómo funciona la navegación por categorías?</AccordionTrigger>
            <AccordionContent>
              Puedes entrar por Xunta de Galicia, Hacienda y Finanzas, Administración General o Justicia y después elegir
              la oposición concreta.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="faq-2">
            <AccordionTrigger>El contenido está validado por un centro?</AccordionTrigger>
            <AccordionContent>
              Si. El contenido de las oposiciones incluidas está validado por CIP Formación, centro con sede en Vigo y
              certificaciones ISO 9001, ISO 14001 e ISO 27001.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="faq-3">
            <AccordionTrigger>Puedo estudiar desde móvil?</AccordionTrigger>
            <AccordionContent>
              Si. La experiencia está optimizada para móvil y escritorio, incluyendo tests, simulacros y seguimiento.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-[#1B3A5C]">Oposita+</p>
            <p className="text-sm text-slate-500">Plataforma IA para opositores y centros.</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-slate-600">
            <Link href="/oposiciones" className="hover:text-[#1B3A5C]">
              Oposiciones
            </Link>
            <Link href="/centros" className="hover:text-[#1B3A5C]">
              Centros
            </Link>
            <Link href="/para-centros" className="hover:text-[#1B3A5C]">
              Para centros
            </Link>
            <Link href="/registro" className="hover:text-[#1B3A5C]">
              Registro
            </Link>
            <Link href="/login" className="hover:text-[#1B3A5C]">
              Iniciar sesión
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
