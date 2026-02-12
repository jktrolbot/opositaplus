'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { seedDemoData } from '@/lib/demo-data';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoggedIn, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isLoggedIn) {
      router.replace('/oposiciones');
    }
  }, [isLoading, isLoggedIn, router]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    const success = login(email, password);
    if (!success) {
      setError('Credenciales incorrectas');
      setSubmitting(false);
      return;
    }

    seedDemoData('xunta-a1');
    seedDemoData('tecnicos-hacienda');
    router.replace('/oposiciones');
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#eef4fb_0%,#f8fafc_25%,#f8fafc_100%)]">
      <section className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-6xl items-center justify-center px-4 py-10">
        <Card className="w-full max-w-md border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-[#1B3A5C]">Iniciar sesión</CardTitle>
            <CardDescription>Accede a Oposita+ para continuar con tu preparación.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="tu@email.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>

              {error && (
                <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
              )}

              <Button
                type="submit"
                className="w-full bg-[#1B3A5C] text-white hover:bg-[#16314d]"
                disabled={submitting || isLoading}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Accediendo...
                  </>
                ) : (
                  'Iniciar sesión'
                )}
              </Button>
            </form>

            <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
              Cuenta de demostración: demo@opositaplus.es / demo1234
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

