'use server';

import { createClient } from '@/lib/supabase/server';

export async function createOrganization(data: {
  name: string;
  slug: string;
  description?: string;
  website?: string;
  contact_email?: string;
  contact_phone?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Create org
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({
      ...data,
      status: 'pending',
      commission_rate: 20.00,
    })
    .select()
    .single();

  if (orgError) throw new Error(orgError.message);

  // Add creator as center_admin
  await supabase.from('organization_members').insert({
    organization_id: org.id,
    user_id: user.id,
    role: 'center_admin',
  });

  return org;
}

export async function linkOppositions(organizationId: string, oppositionIds: string[]) {
  const supabase = await createClient();
  const inserts = oppositionIds.map((id) => ({
    organization_id: organizationId,
    opposition_id: id,
  }));
  const { error } = await supabase.from('organization_oppositions').insert(inserts);
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function getAvailableOppositions() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('oppositions')
    .select('*, opposition_categories(name)')
    .order('name');
  if (error) throw new Error(error.message);
  return data;
}
