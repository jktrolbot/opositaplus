import Link from 'next/link';
import { BarChart3, CheckCircle2, FileText, GraduationCap, Sparkles, UploadCloud, Users2 } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const benefits = [
  {
    title: 'Pipeline IA',
    description: 'Sube PDFs y genera tests automáticamente para cada oposición y nivel.',
    icon: Sparkles,
  },
  {
    title: 'Gestión de alumnos',
    description: 'Controla grupos, avance, repaso y rendimiento por alumno en un solo panel.',
    icon: Users2,
  },
  {
    title: 'Clases en vivo',
    description: 'Programa clases y sesiones de apoyo sin salir de la plataforma.',
    icon: GraduationCap,
  },
  {
    title: 'Dashboard analytics',
    description: 'Mide actividad, progreso y retención para tomar decisiones académicas.',
    icon: BarChart3,
  },
];

const onboarding = [
  { step: '1', title: 'Registro', icon: CheckCircle2, description: 'Crea tu cuenta de centro en minutos.' },
  { step: '2', title: 'Sube material', icon: UploadCloud, description: 'Importa PDFs, apuntes y bancos de preguntas.' },
  { step: '3', title: 'IA procesa', icon: Sparkles, description: 'La plataforma transforma tu contenido en tests y rutas de estudio.' },
  { step: '4', title: 'Alumnos estudian', icon: FileText, description: 'Tus opositores entrenan con seguimiento y tutor IA.' },
];

export default function ParaCentrosPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#eef4fb_0%,#f8fafc_20%,#f8fafc_100%)]">
      <section className="mx-auto max-w-6xl px-4 pb-12 pt-10 sm:pt-14">
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-10 shadow-sm sm:px-12">
          <Badge className="mb-4 border border-emerald-200 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
            Solución B2B para academias
          </Badge>
          <h1 className="max-w-3xl text-balance text-4xl font-bold tracking-tight text-[#1B3A5C] sm:text-5xl">
            Digitaliza tu academia de oposiciones con IA
          </h1>
          <p className="mt-5 max-w-2xl text-base text-slate-600 sm:text-lg">
            Gestiona contenido, alumnos y clases desde un entorno único. Oposita+ convierte tu material académico en
            experiencias de estudio medibles y escalables.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/registro-centro">
              <Button size="lg" className="bg-[#1B3A5C] text-white hover:bg-[#16314d]">
                Registrar mi centro
              </Button>
            </Link>
            <Link href="/centros">
              <Button size="lg" variant="outline">
                Ver marketplace
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-[#1B3A5C]">Beneficios para centros</h2>
          <p className="mt-2 text-sm text-slate-600">Automatiza tareas operativas y dedica mas tiempo a la calidad docente.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <Card key={benefit.title} className="border-slate-200 bg-white">
                <CardHeader>
                  <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#1B3A5C]/10 text-[#1B3A5C]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-[#1B3A5C]">{benefit.title}</CardTitle>
                  <CardDescription>{benefit.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-[#1B3A5C]">Onboarding en 4 pasos</h2>
          <p className="mt-2 text-sm text-slate-600">Implementación guiada para que tu academia este operativa sin fricción.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {onboarding.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.step} className="border-slate-200 bg-white">
                <CardHeader>
                  <Badge className="w-fit bg-[#1B3A5C] text-white hover:bg-[#1B3A5C]">Paso {item.step}</Badge>
                  <div className="mb-1 mt-2 text-[#1B3A5C]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-[#1B3A5C]">{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <Card className="border-emerald-200 bg-white">
          <CardHeader>
            <Badge className="w-fit border border-emerald-200 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Pricing B2B</Badge>
            <CardTitle className="text-[#1B3A5C]">Modelo 80/20 sin cuota fija</CardTitle>
            <CardDescription>
              Oposita+ cobra al alumno final y liquida el 80% para el centro. Tu academia no asume cuota fija mensual.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-2xl font-bold text-[#1B3A5C]">80%</p>
                <p className="text-sm text-slate-600">Ingresos para el centro</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-2xl font-bold text-[#1B3A5C]">20%</p>
                <p className="text-sm text-slate-600">Comisión Oposita+</p>
              </div>
            </div>
            <Link href="/registro-centro">
              <Button className="mt-6 bg-[#10B981] text-white hover:bg-emerald-600">Registrar mi centro</Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-16">
        <h2 className="text-center text-2xl font-bold text-[#1B3A5C]">FAQ para centros</h2>
        <Accordion type="single" collapsible className="mt-8">
          <AccordionItem value="center-faq-1">
            <AccordionTrigger>¿Qué tipo de material puedo subir?</AccordionTrigger>
            <AccordionContent>
              Puedes subir PDFs de temario, apuntes y bancos de preguntas para que la IA genere tests y rutas de estudio.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="center-faq-2">
            <AccordionTrigger>¿Cuánto tarda el onboarding?</AccordionTrigger>
            <AccordionContent>
              La configuración inicial suele completarse en el mismo día y el procesamiento inicial depende del volumen de
              material.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="center-faq-3">
            <AccordionTrigger>¿Necesito equipo técnico?</AccordionTrigger>
            <AccordionContent>
              No. Oposita+ está orientado a equipos académicos y administrativos, con onboarding guiado paso a paso.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>
    </main>
  );
}
