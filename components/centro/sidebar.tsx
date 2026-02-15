'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  Calendar,
  CreditCard,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Settings,
  Users,
  UserCheck,
  Brain,
} from 'lucide-react';
import type { ElementType } from 'react';
import { normalizeRole, type AppRole } from '@/lib/auth/roles';
import { useOrganization } from '@/lib/hooks/use-organization';

interface NavItem {
  href: string;
  label: string;
  icon: ElementType;
  roles: AppRole[];
}

function getNavItems(slug: string): NavItem[] {
  const base = `/centro/${slug}`;
  return [
    { href: base, label: 'Dashboard', icon: LayoutDashboard, roles: ['super_admin', 'centro_admin', 'profesor', 'alumno'] },
    { href: `${base}/alumnos`, label: 'Alumnos', icon: Users, roles: ['super_admin', 'centro_admin', 'profesor'] },
    { href: `${base}/profesores`, label: 'Profesores', icon: UserCheck, roles: ['super_admin', 'centro_admin'] },
    { href: `${base}/contenido`, label: 'Contenido', icon: FileText, roles: ['super_admin', 'centro_admin', 'profesor'] },
    { href: `${base}/clases`, label: 'Clases', icon: Calendar, roles: ['super_admin', 'centro_admin', 'profesor', 'alumno'] },
    { href: `${base}/oposiciones`, label: 'Oposiciones', icon: BookOpen, roles: ['super_admin', 'centro_admin', 'profesor', 'alumno'] },
    { href: `${base}/herramientas-ia`, label: 'IA Tools', icon: Brain, roles: ['super_admin', 'centro_admin', 'profesor', 'alumno'] },
    { href: `${base}/planes`, label: 'Planes y Pagos', icon: CreditCard, roles: ['super_admin', 'centro_admin'] },
    { href: `${base}/examenes`, label: 'Exámenes', icon: GraduationCap, roles: ['super_admin', 'centro_admin', 'profesor', 'alumno'] },
    { href: `${base}/ajustes`, label: 'Ajustes', icon: Settings, roles: ['super_admin', 'centro_admin'] },
  ];
}

export function CentroSidebar({ slug }: { slug: string }) {
  const pathname = usePathname();
  const { organization, userRole } = useOrganization();
  const normalizedRole = normalizeRole(userRole);

  const navItems = getNavItems(slug).filter(
    (item) => normalizedRole && item.roles.includes(normalizedRole)
  );

  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-200 bg-white">
      {/* Header */}
      <div className="border-b border-slate-200 p-4">
        <h2 className="truncate text-lg font-bold text-[#1B3A5C]">
          {organization?.name ?? 'Centro'}
        </h2>
        {normalizedRole && (
          <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {normalizedRole === 'centro_admin'
              ? 'Admin'
              : normalizedRole === 'profesor'
                ? 'Profesor'
                : normalizedRole === 'alumno'
                  ? 'Alumno'
                  : 'Super Admin'}
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== `/centro/${slug}` && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? 'bg-[#1B3A5C] text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
