'use client';

import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/lib/auth-context';
import { canAccess, type AppRole, type AuthAction, type AuthResource } from '@/lib/auth/roles';

interface AuthGuardProps {
  children: ReactNode;
  allowedRoles?: AppRole[];
  resource?: AuthResource;
  action?: AuthAction;
  fallbackPath?: string;
}

export function AuthGuard({
  children,
  allowedRoles,
  resource,
  action = 'read',
  fallbackPath = '/',
}: AuthGuardProps) {
  const router = useRouter();
  const { isLoggedIn, isLoading, role } = useAuth();

  const roleAllowed = !allowedRoles || (role !== null && allowedRoles.includes(role));
  const resourceAllowed = !resource || canAccess(resource, action, role);
  const hasAccess = roleAllowed && resourceAllowed;

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace('/login');
      return;
    }

    if (!isLoading && isLoggedIn && !hasAccess) {
      router.replace(fallbackPath);
    }
  }, [isLoading, isLoggedIn, hasAccess, fallbackPath, router]);

  if (isLoading || !isLoggedIn || !hasAccess) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-[#1B3A5C]" />
      </div>
    );
  }

  return <>{children}</>;
}
