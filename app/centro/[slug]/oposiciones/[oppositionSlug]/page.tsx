'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getDefaultOppositionTab } from './tabs';

export default function OppositionTabRedirectPage({
  params,
}: {
  params: Promise<{ slug: string; oppositionSlug: string }>;
}) {
  const { slug, oppositionSlug } = use(params);
  const router = useRouter();
  const { isLoading, role } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    const defaultTab = getDefaultOppositionTab(role);
    if (!defaultTab) {
      router.replace(`/centro/${slug}/oposiciones`);
      return;
    }
    router.replace(`/centro/${slug}/oposiciones/${oppositionSlug}/${defaultTab}`);
  }, [isLoading, oppositionSlug, role, router, slug]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-[#1B3A5C]" />
    </div>
  );
}
