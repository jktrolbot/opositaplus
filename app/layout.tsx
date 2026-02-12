import type { Metadata } from 'next';
import './globals.css';
import { SiteNav } from '@/components/site-nav';

export const metadata: Metadata = {
  title: 'Oposita+ | Preparación por oposiciones',
  description:
    'Plataforma de preparación para oposiciones en España con tests, tutor, planificación, repaso y simulacros por convocatoria.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-[#F8FAFC] text-slate-900 antialiased">
        <SiteNav />
        {children}
      </body>
    </html>
  );
}
