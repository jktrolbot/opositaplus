import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getStripe } from '@/lib/stripe/config';
import { createClient } from '@/lib/supabase/server';
import type Stripe from 'stripe';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StripeSubscription = Stripe.Subscription & Record<string, any>;

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = await createClient();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const { user_id, organization_id, plan_id } = session.metadata ?? {};

      if (user_id && organization_id && plan_id) {
        await supabase.from('subscriptions').insert({
          user_id,
          organization_id,
          plan_id,
          stripe_subscription_id: session.subscription as string,
          stripe_customer_id: session.customer as string,
          status: 'active',
          current_period_start: new Date().toISOString(),
        });

        // Record payment
        await supabase.from('payments').insert({
          user_id,
          organization_id,
          stripe_payment_intent_id: session.payment_intent as string,
          amount_cents: session.amount_total ?? 0,
          currency: session.currency ?? 'eur',
          status: 'succeeded',
        });

        // Add as student member if not already
        const { data: existing } = await supabase
          .from('organization_members')
          .select('id')
          .eq('organization_id', organization_id)
          .eq('user_id', user_id)
          .single();

        if (!existing) {
          await supabase.from('organization_members').insert({
            organization_id,
            user_id,
            role: 'student',
          });
        }
      }
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as StripeSubscription;
      await supabase
        .from('subscriptions')
        .update({
          status: sub.status as string,
          cancel_at_period_end: sub.cancel_at_period_end,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', sub.id);
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as StripeSubscription;
      await supabase
        .from('subscriptions')
        .update({ status: 'canceled', updated_at: new Date().toISOString() })
        .eq('stripe_subscription_id', sub.id);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
