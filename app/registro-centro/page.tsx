'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';

export default function RegistroCentroPage() {
  const router = useRouter();
  const { isLoggedIn, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isLoggedIn) {
        router.replace('/onboarding');
      } else {
        router.replace('/registro?next=/onboarding');
      }
    }
  }, [isLoggedIn, isLoading, router]);

  return null;
}
