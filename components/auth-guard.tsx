'use client';

import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/lib/auth-context';

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { isLoggedIn, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace('/login');
    }
  }, [isLoading, isLoggedIn, router]);

  if (isLoading || !isLoggedIn) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-[#1B3A5C]" />
      </div>
    );
  }

  return <>{children}</>;
}

