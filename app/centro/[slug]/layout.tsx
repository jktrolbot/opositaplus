'use client';

import { use, type ReactNode } from 'react';
import { OrganizationProvider } from '@/lib/hooks/use-organization';
import { CentroSidebar } from '@/components/centro/sidebar';
import { CenterHeader } from '@/components/centro/center-header';
import { AuthGuard } from '@/components/auth-guard';

export default function CentroLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  return (
    <AuthGuard>
      <OrganizationProvider slug={slug}>
        <div className="flex h-screen flex-col">
          <CenterHeader slug={slug} />
          <div className="flex flex-1 overflow-hidden">
            <div className="hidden md:block">
              <CentroSidebar slug={slug} />
            </div>
            <main className="flex-1 overflow-y-auto bg-slate-50 p-6">
              {children}
            </main>
          </div>
        </div>
      </OrganizationProvider>
    </AuthGuard>
  );
}
