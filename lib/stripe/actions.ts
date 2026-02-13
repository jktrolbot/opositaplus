'use server';

import { getStripe } from './config';
import { createClient } from '@/lib/supabase/server';

export async function createCheckoutSession(planId: string, organizationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get plan details
  const { data: plan } = await supabase
    .from('plans')
    .select('*')
    .eq('id', planId)
    .single();

  if (!plan) throw new Error('Plan not found');

  // Create or get Stripe customer
  let customerId: string;
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .not('stripe_customer_id', 'is', null)
    .limit(1)
    .single();

  if (existingSub?.stripe_customer_id) {
    customerId = existingSub.stripe_customer_id;
  } else {
    const customer = await getStripe().customers.create({
      email: user.email,
      metadata: { user_id: user.id, organization_id: organizationId },
    });
    customerId = customer.id;
  }

  const session = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: plan.type === 'one_time' ? 'payment' : 'subscription',
    line_items: plan.stripe_price_id
      ? [{ price: plan.stripe_price_id, quantity: 1 }]
      : [{
          price_data: {
            currency: plan.currency ?? 'eur',
            product_data: { name: plan.name },
            unit_amount: plan.price_cents,
            ...(plan.type !== 'one_time' && {
              recurring: {
                interval: plan.type === 'monthly' ? 'month' : plan.type === 'quarterly' ? 'month' : 'year',
                interval_count: plan.type === 'quarterly' ? 3 : 1,
              },
            }),
          },
          quantity: 1,
        }],
    metadata: {
      user_id: user.id,
      organization_id: organizationId,
      plan_id: planId,
    },
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/centro/${organizationId}?payment=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/centro/${organizationId}/planes`,
  });

  return { url: session.url };
}

export async function createCustomerPortalSession(organizationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .eq('organization_id', organizationId)
    .not('stripe_customer_id', 'is', null)
    .limit(1)
    .single();

  if (!sub?.stripe_customer_id) throw new Error('No subscription found');

  const session = await getStripe().billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/centro/${organizationId}/planes`,
  });

  return { url: session.url };
}
