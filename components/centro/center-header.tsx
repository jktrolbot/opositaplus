'use client';

import Link from 'next/link';
import { LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { useOrganization } from '@/lib/hooks/use-organization';

export function CenterHeader({ slug }: { slug: string }) {
  const { user, signOut } = useAuth();
  const { organization } = useOrganization();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4">
      <div className="flex items-center gap-3">
        <button
          className="rounded-md p-1 text-slate-500 hover:bg-slate-100 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <Link href="/" className="text-lg font-bold text-[#1B3A5C]">
          Oposita+
        </Link>
        {organization && (
          <span className="hidden text-sm text-slate-400 md:inline">/ {organization.name}</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {user && (
          <span className="hidden text-sm text-slate-600 md:inline">{user.email}</span>
        )}
        <Button variant="ghost" size="sm" onClick={() => signOut()}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
