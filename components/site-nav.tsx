'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, LogOut, Menu, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';

const links = [
  { href: '/', label: 'Inicio' },
  { href: '/oposiciones', label: 'Oposiciones' },
  { href: '/centros', label: 'Centros' },
  { href: '/para-centros', label: 'Para centros' },
];

export function SiteNav() {
  const pathname = usePathname();
  const { user, isLoggedIn, isLoading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const activeHref = useMemo(() => {
    if (!pathname) return '/';
    if (pathname.startsWith('/oposiciones')) return '/oposiciones';
    if (pathname.startsWith('/centros')) return '/centros';
    if (pathname.startsWith('/para-centros')) return '/para-centros';
    return '/';
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold tracking-tight text-[#1B3A5C]">
          Oposita+
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          <nav className="flex items-center gap-2">
            {links.map((link) => {
              const active = activeHref === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                    active ? 'bg-[#1B3A5C] text-white' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-2">
            {!isLoading && !isLoggedIn && (
              <div className="flex items-center gap-2">
                <Link href="/registro">
                  <Button variant="outline">Registrarse</Button>
                </Link>
                <Link href="/login">
                  <Button className="bg-[#1B3A5C] text-white hover:bg-[#16314d]">Iniciar sesión</Button>
                </Link>
              </div>
            )}

            {!isLoading && isLoggedIn && user && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((value) => !value)}
                  className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1B3A5C] text-xs font-semibold text-white">
                    {user.avatar}
                  </span>
                  <span className="max-w-[120px] truncate font-medium">{user.name}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
                    <p className="px-2 py-1 text-xs text-slate-500">{user.email}</p>
                    <button
                      type="button"
                      onClick={logout}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                    >
                      <LogOut className="h-4 w-4" />
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {open && (
        <nav className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <div className="flex flex-col gap-2">
            {links.map((link) => {
              const active = activeHref === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-md px-3 py-2 text-sm font-medium ${
                    active ? 'bg-[#1B3A5C] text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            <div className="mt-2 border-t border-slate-200 pt-3">
              {!isLoading && !isLoggedIn && (
                <div className="space-y-2">
                  <Link
                    href="/registro"
                    onClick={() => setOpen(false)}
                    className="block rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"
                  >
                    Registrarse
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="block rounded-md bg-[#1B3A5C] px-3 py-2 text-sm font-medium text-white"
                  >
                    Iniciar sesión
                  </Link>
                </div>
              )}

              {!isLoading && isLoggedIn && user && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1B3A5C] text-xs font-semibold text-white">
                      {user.avatar}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{user.name}</p>
                      <p className="truncate text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"
                  >
                    <LogOut className="h-4 w-4" />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
