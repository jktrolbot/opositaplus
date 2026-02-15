'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { normalizeRole } from '@/lib/auth/roles';
import type { Organization, UserRole } from '@/lib/types';

interface OrganizationContextValue {
  organization: Organization | null;
  userRole: UserRole | null;
  isLoading: boolean;
  error: string | null;
}

const OrganizationContext = createContext<OrganizationContextValue>({
  organization: null,
  userRole: null,
  isLoading: true,
  error: null,
});

export function OrganizationProvider({
  slug,
  children,
}: {
  slug: string;
  children: ReactNode;
}) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      try {
        // Fetch organization
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('slug', slug)
          .single();

        if (orgError || !org) {
          setError('Centro no encontrado');
          setIsLoading(false);
          return;
        }

        setOrganization(org as unknown as Organization);

        // Fetch user role in this org
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: member } = await supabase
            .from('organization_members')
            .select('role')
            .eq('organization_id', org.id)
            .eq('user_id', user.id)
            .single();

          if (member) {
            const normalized = normalizeRole(member.role);
            setUserRole((normalized ?? member.role) as UserRole);
          }

          // Check super_admin
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('is_super_admin')
            .eq('id', user.id)
            .maybeSingle();

          if (profile?.is_super_admin) {
            setUserRole('super_admin');
          }
        }
      } catch {
        setError('Error al cargar el centro');
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [slug]);

  return (
    <OrganizationContext.Provider value={{ organization, userRole, isLoading, error }}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  return useContext(OrganizationContext);
}
