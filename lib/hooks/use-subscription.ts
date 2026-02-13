'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Subscription } from '@/lib/types';

export function useSubscription(organizationId: string | null) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) {
      setIsLoading(false);
      return;
    }

    const supabase = createClient();

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('organization_id', organizationId!)
        .in('status', ['active', 'trialing'])
        .limit(1)
        .single();

      setSubscription(data as unknown as Subscription | null);
      setIsLoading(false);
    }

    load();
  }, [organizationId]);

  return {
    subscription,
    isActive: subscription?.status === 'active' || subscription?.status === 'trialing',
    isLoading,
  };
}
