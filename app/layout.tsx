import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from 'next-themes';

export const metadata: Metadata = {
  title: 'Oposita+ | Todas las herramientas para aprobar tu oposición',
  description: 'Plataforma completa de preparación para oposiciones en España. Tests adaptativos, preparador personal 24/7, seguimiento de progreso y simulacros de examen.',
  keywords: 'oposiciones, estudio, tests, preparador, Xunta, Galicia, España',
  openGraph: {
    title: 'Oposita+ | Prepara tu oposición',
    description: 'Todas las herramientas que necesitas para aprobar',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
