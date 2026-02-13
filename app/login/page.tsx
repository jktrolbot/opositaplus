'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';

type AuthMode = 'password' | 'magic-link';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signInWithMagicLink, isLoggedIn, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<AuthMode>('password');

  useEffect(() => {
    if (!isLoading && isLoggedIn) {
      router.replace('/oposiciones');
    }
  }, [isLoading, isLoggedIn, router]);

  const handlePasswordLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    const { error: err } = await signIn(email, password);
    if (err) {
      setError(err);
      setSubmitting(false);
      return;
    }

    router.replace('/oposiciones');
  };

  const handleMagicLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    const { error: err } = await signInWithMagicLink(email);
    setSubmitting(false);
    if (err) {
      setError(err);
      return;
    }

    setSuccess('¡Enlace enviado! Revisa tu correo electrónico.');
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
            {/* Mode toggle */}
            <div className="mb-4 flex gap-2 rounded-lg bg-slate-100 p-1">
              <button
                type="button"
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${mode === 'password' ? 'bg-white text-[#1B3A5C] shadow-sm' : 'text-slate-500'}`}
                onClick={() => { setMode('password'); setError(''); setSuccess(''); }}
              >
                Contraseña
              </button>
              <button
                type="button"
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${mode === 'magic-link' ? 'bg-white text-[#1B3A5C] shadow-sm' : 'text-slate-500'}`}
                onClick={() => { setMode('magic-link'); setError(''); setSuccess(''); }}
              >
                Magic Link
              </button>
            </div>

            {mode === 'password' ? (
              <form className="space-y-4" onSubmit={handlePasswordLogin}>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    onChange={(e) => setPassword(e.target.value)}
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
            ) : (
              <form className="space-y-4" onSubmit={handleMagicLink}>
                <div className="space-y-2">
                  <Label htmlFor="email-magic">Correo electrónico</Label>
                  <Input
                    id="email-magic"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    autoComplete="email"
                    required
                  />
                </div>

                {error && (
                  <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
                )}
                {success && (
                  <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-[#1B3A5C] text-white hover:bg-[#16314d]"
                  disabled={submitting || isLoading}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Enviar enlace mágico
                    </>
                  )}
                </Button>
              </form>
            )}

            <p className="mt-4 text-center text-sm text-slate-500">
              ¿No tienes cuenta?{' '}
              <a href="/registro" className="font-medium text-[#1B3A5C] hover:underline">
                Regístrate
              </a>
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
