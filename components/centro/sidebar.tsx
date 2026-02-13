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
import { useOrganization } from '@/lib/hooks/use-organization';
import type { UserRole } from '@/lib/types';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: UserRole[];
}

function getNavItems(slug: string): NavItem[] {
  const base = `/centro/${slug}`;
  return [
    { href: base, label: 'Dashboard', icon: LayoutDashboard, roles: ['super_admin', 'center_admin', 'teacher', 'student'] },
    { href: `${base}/alumnos`, label: 'Alumnos', icon: Users, roles: ['super_admin', 'center_admin', 'teacher'] },
    { href: `${base}/profesores`, label: 'Profesores', icon: UserCheck, roles: ['super_admin', 'center_admin'] },
    { href: `${base}/contenido`, label: 'Contenido', icon: FileText, roles: ['super_admin', 'center_admin', 'teacher'] },
    { href: `${base}/clases`, label: 'Clases', icon: Calendar, roles: ['super_admin', 'center_admin', 'teacher', 'student'] },
    { href: `${base}/oposiciones`, label: 'Oposiciones', icon: BookOpen, roles: ['super_admin', 'center_admin', 'teacher', 'student'] },
    { href: `${base}/herramientas-ia`, label: 'IA Tools', icon: Brain, roles: ['super_admin', 'center_admin', 'teacher', 'student'] },
    { href: `${base}/planes`, label: 'Planes y Pagos', icon: CreditCard, roles: ['super_admin', 'center_admin'] },
    { href: `${base}/examenes`, label: 'Exámenes', icon: GraduationCap, roles: ['super_admin', 'center_admin', 'teacher', 'student'] },
    { href: `${base}/ajustes`, label: 'Ajustes', icon: Settings, roles: ['super_admin', 'center_admin'] },
  ];
}

export function CentroSidebar({ slug }: { slug: string }) {
  const pathname = usePathname();
  const { organization, userRole } = useOrganization();

  const navItems = getNavItems(slug).filter(
    (item) => userRole && item.roles.includes(userRole)
  );

  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-200 bg-white">
      {/* Header */}
      <div className="border-b border-slate-200 p-4">
        <h2 className="truncate text-lg font-bold text-[#1B3A5C]">
          {organization?.name ?? 'Centro'}
        </h2>
        {userRole && (
          <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {userRole === 'center_admin' ? 'Admin' : userRole === 'teacher' ? 'Profesor' : userRole === 'student' ? 'Alumno' : 'Super Admin'}
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
