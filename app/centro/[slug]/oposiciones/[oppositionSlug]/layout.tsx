'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { use, useMemo, type ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getOposicionBySlug } from '@/data/oposiciones';
import { getAvailableOppositionTabs } from './tabs';

export default function CenterOppositionLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string; oppositionSlug: string }>;
}) {
  const { slug, oppositionSlug } = use(params);
  const pathname = usePathname();
  const { role } = useAuth();
  const oposicion = getOposicionBySlug(oppositionSlug);

  const tabs = useMemo(() => {
    const basePath = `/centro/${slug}/oposiciones/${oppositionSlug}`;
    return getAvailableOppositionTabs(role).map((tab) => ({
      ...tab,
      href: `${basePath}/${tab.key}`,
    }));
  }, [oppositionSlug, role, slug]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Link
          href={`/centro/${slug}/oposiciones`}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a oposiciones
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-[#1B3A5C]">
            {oposicion?.name ?? oppositionSlug}
          </h1>
          <p className="text-sm text-slate-500">Centro · Oposición · Herramientas de estudio</p>
        </div>
      </div>

      <nav className="overflow-x-auto rounded-lg border border-slate-200 bg-white p-1">
        <ul className="flex min-w-max gap-1">
          {tabs.map((tab) => {
            const active = pathname === tab.href;
            return (
              <li key={tab.key}>
                <Link
                  href={tab.href}
                  className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm transition ${
                    active
                      ? 'bg-[#1B3A5C] text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {children}
    </div>
  );
}
