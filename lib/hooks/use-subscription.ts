'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Subscription } from '@/lib/types';

export function useSubscription(organizationId: string | null) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(organizationId));

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!organizationId) {
        if (!cancelled) setIsLoading(false);
        return;
      }

      if (!cancelled) setIsLoading(true);

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) setIsLoading(false);
        return;
      }

      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('organization_id', organizationId)
        .in('status', ['active', 'trialing'])
        .limit(1)
        .single();

      if (cancelled) return;

      setSubscription(data as Subscription | null);
      setIsLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  return {
    subscription,
    isActive: subscription?.status === 'active' || subscription?.status === 'trialing',
    isLoading,
  };
}
