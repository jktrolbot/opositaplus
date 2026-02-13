import { describe, it, expect } from 'vitest';

/**
 * Commission calculation logic:
 * - Platform takes commission_rate% (default 20%) of total revenue
 * - Center receives net_amount = total_revenue - commission
 */

function calculateSettlement(totalRevenueCents: number, commissionRate: number) {
  const commissionCents = Math.round(totalRevenueCents * (commissionRate / 100));
  const netAmountCents = totalRevenueCents - commissionCents;
  return { totalRevenueCents, commissionCents, netAmountCents };
}

describe('Settlement calculations', () => {
  it('calculates default 20% commission correctly', () => {
    const result = calculateSettlement(10000, 20);
    expect(result.commissionCents).toBe(2000);
    expect(result.netAmountCents).toBe(8000);
  });

  it('handles 0 revenue', () => {
    const result = calculateSettlement(0, 20);
    expect(result.commissionCents).toBe(0);
    expect(result.netAmountCents).toBe(0);
  });

  it('handles custom commission rate', () => {
    const result = calculateSettlement(15000, 15);
    expect(result.commissionCents).toBe(2250);
    expect(result.netAmountCents).toBe(12750);
  });

  it('rounds commission correctly', () => {
    const result = calculateSettlement(333, 20);
    expect(result.commissionCents).toBe(67);
    expect(result.netAmountCents).toBe(266);
  });

  it('handles 100% commission', () => {
    const result = calculateSettlement(5000, 100);
    expect(result.commissionCents).toBe(5000);
    expect(result.netAmountCents).toBe(0);
  });

  it('handles 0% commission', () => {
    const result = calculateSettlement(5000, 0);
    expect(result.commissionCents).toBe(0);
    expect(result.netAmountCents).toBe(5000);
  });
});
