'use client';

import { useEffect, useState } from 'react';
import type { Organization } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { useOrganization } from '@/lib/hooks/use-organization';

type OppositionSummary = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

export function useCenterOpposition(oppositionSlug: string) {
  const { organization, isLoading: organizationLoading, error: organizationError } = useOrganization();
  const [opposition, setOpposition] = useState<OppositionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!organization || !oppositionSlug) return;
    const currentOrganization = organization;

    const supabase = createClient();

    async function loadOpposition() {
      setIsLoading(true);
      setError(null);

      const { data: oppositionData, error: oppositionError } = await supabase
        .from('oppositions')
        .select('id, name, slug, description')
        .eq('slug', oppositionSlug)
        .maybeSingle();

      if (oppositionError || !oppositionData) {
        setOpposition(null);
        setError('Oposición no encontrada');
        setIsLoading(false);
        return;
      }

      const { data: relation, error: relationError } = await supabase
        .from('organization_oppositions')
        .select('opposition_id')
        .eq('organization_id', currentOrganization.id)
        .eq('opposition_id', oppositionData.id)
        .maybeSingle();

      if (relationError || !relation) {
        setOpposition(null);
        setError('La oposición no está asignada a este centro');
        setIsLoading(false);
        return;
      }

      setOpposition(oppositionData as OppositionSummary);
      setIsLoading(false);
    }

    loadOpposition().catch((loadError) => {
      setError((loadError as Error).message);
      setIsLoading(false);
    });
  }, [oppositionSlug, organization]);

  return {
    organization: organization as Organization | null,
    opposition,
    isLoading: organizationLoading || isLoading,
    error: organizationError ?? error,
  };
}
