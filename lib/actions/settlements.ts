'use server';

import { createClient } from '@/lib/supabase/server';

export async function getSettlements(organizationId?: string) {
  const supabase = await createClient();
  let query = supabase
    .from('center_settlements')
    .select('*, organizations(name, slug)')
    .order('period_end', { ascending: false });

  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

export async function createSettlement(data: {
  organization_id: string;
  period_start: string;
  period_end: string;
  total_revenue_cents: number;
  commission_cents: number;
  net_amount_cents: number;
}) {
  const supabase = await createClient();
  const { data: settlement, error } = await supabase
    .from('center_settlements')
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return settlement;
}

export async function markSettlementPaid(settlementId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('center_settlements')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', settlementId);

  if (error) throw new Error(error.message);
  return { success: true };
}

export async function getAdminStats() {
  const supabase = await createClient();

  const [orgsResult, membersResult, paymentsResult] = await Promise.all([
    supabase.from('organizations').select('id', { count: 'exact' }),
    supabase.from('organization_members').select('id', { count: 'exact' }),
    supabase.from('payments').select('amount_cents').eq('status', 'succeeded'),
  ]);

  const totalRevenue = (paymentsResult.data ?? []).reduce((sum, p) => sum + (p.amount_cents ?? 0), 0);

  return {
    totalOrgs: orgsResult.count ?? 0,
    totalMembers: membersResult.count ?? 0,
    totalRevenueCents: totalRevenue,
  };
}
