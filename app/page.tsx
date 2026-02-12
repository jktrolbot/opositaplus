import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Target, MessageCircle, TrendingUp, Calendar, Clock, Repeat, Check } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-white to-[#F8FAFC]">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-[#1B3A5C]">Oposita+</div>
          <nav className="hidden md:flex gap-6">
            <Link href="/dashboard" className="text-gray-700 hover:text-[#1B3A5C]">Panel</Link>
            <Link href="/test" className="text-gray-700 hover:text-[#1B3A5C]">Tests</Link>
            <Link href="/tutor" className="text-gray-700 hover:text-[#1B3A5C]">Preparador</Link>
            <Link href="/planner" className="text-gray-700 hover:text-[#1B3A5C]">Planificador</Link>
          </nav>
          <Link href="/dashboard">
            <Button className="bg-[#10B981] hover:bg-[#059669] text-white">Empieza gratis</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-[#1B3A5C] mb-6">
            Todas las herramientas que necesitas para aprobar
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Prepara tu oposición con las mejores herramientas: tests adaptativos, preparador personal, 
            seguimiento inteligente y mucho más
          </p>
          <Link href="/dashboard">
            <Button size="lg" className="bg-[#10B981] hover:bg-[#059669] text-white text-lg px-8 py-6">
              Empieza gratis
            </Button>
          </Link>
          <p className="text-sm text-gray-500 mt-4">Sin tarjeta de crédito. Empieza en 30 segundos.</p>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-[#1B3A5C] mb-12">
          Todo lo que necesitas en un solo lugar
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="border-2 hover:border-[#10B981] transition-all">
            <CardHeader>
              <Target className="w-12 h-12 text-[#10B981] mb-4" />
              <CardTitle>Tests que se adaptan a tu nivel</CardTitle>
              <CardDescription>
                Practica con miles de preguntas que se ajustan automáticamente a tu progreso
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="border-2 hover:border-[#10B981] transition-all">
            <CardHeader>
              <MessageCircle className="w-12 h-12 text-[#10B981] mb-4" />
              <CardTitle>Tu preparador personal 24/7</CardTitle>
              <CardDescription>
                Consulta cualquier duda sobre legislación, temas y exámenes en cualquier momento
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="border-2 hover:border-[#10B981] transition-all">
            <CardHeader>
              <TrendingUp className="w-12 h-12 text-[#10B981] mb-4" />
              <CardTitle>Seguimiento inteligente de progreso</CardTitle>
              <CardDescription>
                Visualiza tu evolución, identifica puntos débiles y mide tu preparación real
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="border-2 hover:border-[#10B981] transition-all">
            <CardHeader>
              <Calendar className="w-12 h-12 text-[#10B981] mb-4" />
              <CardTitle>Planificador de estudio personalizado</CardTitle>
              <CardDescription>
                Crea un plan optimizado basado en tu fecha de examen y tiempo disponible
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="border-2 hover:border-[#10B981] transition-all">
            <CardHeader>
              <Clock className="w-12 h-12 text-[#10B981] mb-4" />
              <CardTitle>Simulacros de examen</CardTitle>
              <CardDescription>
                Practica en condiciones reales con temporizador y evaluación detallada
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="border-2 hover:border-[#10B981] transition-all">
            <CardHeader>
              <Repeat className="w-12 h-12 text-[#10B981] mb-4" />
              <CardTitle>Repaso inteligente</CardTitle>
              <CardDescription>
                Repite las preguntas que más te cuestan con un sistema de repetición espaciada
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Backed by Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="bg-gradient-to-r from-[#1B3A5C] to-[#10B981] rounded-2xl p-12 text-white">
          <h3 className="text-2xl font-bold mb-4">Respaldado por CIP Formación</h3>
          <p className="text-xl">35 años formando opositores con éxito</p>
          <div className="mt-6 text-sm opacity-90">
            [Logo CIP Formación]
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-[#1B3A5C] mb-12">
          Elige el plan que mejor se adapte a ti
        </h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-2xl">Gratis</CardTitle>
              <div className="text-4xl font-bold text-[#1B3A5C]">0€</div>
              <CardDescription>Para empezar</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-[#10B981] mt-0.5" />
                  <span>10 tests al mes</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-[#10B981] mt-0.5" />
                  <span>Acceso limitado al preparador</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-[#10B981] mt-0.5" />
                  <span>Estadísticas básicas</span>
                </li>
              </ul>
              <Button className="w-full mt-6 bg-gray-200 text-gray-800 hover:bg-gray-300">
                Comenzar gratis
              </Button>
            </CardContent>
          </Card>

          <Card className="border-4 border-[#10B981] relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#10B981] text-white px-4 py-1 rounded-full text-sm font-semibold">
              Más popular
            </div>
            <CardHeader>
              <CardTitle className="text-2xl">Pro</CardTitle>
              <div className="text-4xl font-bold text-[#1B3A5C]">19€<span className="text-lg">/mes</span></div>
              <CardDescription>Para opositores serios</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-[#10B981] mt-0.5" />
                  <span>Tests ilimitados</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-[#10B981] mt-0.5" />
                  <span>Preparador personal completo</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-[#10B981] mt-0.5" />
                  <span>Planificador de estudio</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-[#10B981] mt-0.5" />
                  <span>Simulacros ilimitados</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-[#10B981] mt-0.5" />
                  <span>Repaso inteligente</span>
                </li>
              </ul>
              <Button className="w-full mt-6 bg-[#10B981] hover:bg-[#059669] text-white">
                Empezar ahora
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-2xl">Premium</CardTitle>
              <div className="text-4xl font-bold text-[#1B3A5C]">39€<span className="text-lg">/mes</span></div>
              <CardDescription>Máxima preparación</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-[#10B981] mt-0.5" />
                  <span>Todo lo de Pro</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-[#10B981] mt-0.5" />
                  <span>Sesiones de tutoría en vivo</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-[#10B981] mt-0.5" />
                  <span>Corrección de exámenes</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-[#10B981] mt-0.5" />
                  <span>Materiales exclusivos</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-[#10B981] mt-0.5" />
                  <span>Soporte prioritario</span>
                </li>
              </ul>
              <Button className="w-full mt-6 bg-[#1B3A5C] hover:bg-[#152e4a] text-white">
                Empezar ahora
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Social Proof */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold text-[#1B3A5C] mb-8">
          Miles de opositores ya se preparan mejor
        </h2>
        <div className="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          <div>
            <div className="text-4xl font-bold text-[#10B981]">12.450</div>
            <div className="text-gray-600">Usuarios activos</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-[#10B981]">2.1M</div>
            <div className="text-gray-600">Tests realizados</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-[#10B981]">87%</div>
            <div className="text-gray-600">Tasa de éxito</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-[#10B981]">4.8/5</div>
            <div className="text-gray-600">Valoración media</div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-[#1B3A5C] mb-12">
          Preguntas frecuentes
        </h2>
        <Accordion type="single" collapsible className="max-w-3xl mx-auto">
          <AccordionItem value="item-1">
            <AccordionTrigger>¿Puedo probar la plataforma antes de pagar?</AccordionTrigger>
            <AccordionContent>
              Sí, ofrecemos un plan gratuito con acceso limitado para que pruebes la plataforma sin compromiso.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>¿Qué oposiciones están disponibles?</AccordionTrigger>
            <AccordionContent>
              Actualmente tenemos contenido para Xunta de Galicia A1, y estamos añadiendo constantemente más oposiciones.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>¿Puedo cancelar mi suscripción en cualquier momento?</AccordionTrigger>
            <AccordionContent>
              Sí, puedes cancelar tu suscripción en cualquier momento desde tu panel de usuario. No hay permanencia.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-4">
            <AccordionTrigger>¿Cómo funciona el preparador personal?</AccordionTrigger>
            <AccordionContent>
              El preparador es un asistente disponible 24/7 que responde tus dudas sobre legislación, temas y exámenes basándose en la normativa oficial.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-5">
            <AccordionTrigger>¿Los tests se actualizan con nueva legislación?</AccordionTrigger>
            <AccordionContent>
              Sí, nuestro equipo actualiza constantemente el contenido para reflejar cambios legislativos y normativas vigentes.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* Footer */}
      <footer className="bg-[#1B3A5C] text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold mb-4">Oposita+</div>
              <p className="text-gray-300">
                Todas las herramientas para aprobar tu oposición
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Producto</h4>
              <ul className="space-y-2 text-gray-300">
                <li><Link href="/dashboard">Panel</Link></li>
                <li><Link href="/test">Tests</Link></li>
                <li><Link href="/tutor">Preparador</Link></li>
                <li><Link href="/planner">Planificador</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-gray-300">
                <li><Link href="/#">Sobre nosotros</Link></li>
                <li><Link href="/#">Blog</Link></li>
                <li><Link href="/#">Contacto</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-300">
                <li><Link href="/#">Privacidad</Link></li>
                <li><Link href="/#">Términos</Link></li>
                <li><Link href="/#">Cookies</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2026 Oposita+. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
