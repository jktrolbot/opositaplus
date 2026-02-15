import { describe, it, expect } from 'vitest';
import type { Organization, Plan, Subscription, UserRole } from '@/lib/types';

describe('Domain Types', () => {
  it('should define valid user roles', () => {
    const roles: UserRole[] = ['super_admin', 'centro_admin', 'profesor', 'alumno'];
    expect(roles).toHaveLength(4);
  });

  it('should create valid organization shape', () => {
    const org: Partial<Organization> = {
      name: 'Test Center',
      slug: 'test-center',
      status: 'active',
      commission_rate: 20,
    };
    expect(org.name).toBe('Test Center');
    expect(org.status).toBe('active');
  });

  it('should create valid plan shape', () => {
    const plan: Partial<Plan> = {
      name: 'Monthly',
      type: 'monthly',
      price_cents: 8900,
      currency: 'eur',
      includes_ai: true,
    };
    expect(plan.price_cents).toBe(8900);
    expect(plan.includes_ai).toBe(true);
  });

  it('should format price correctly', () => {
    const cents = 8900;
    const formatted = (cents / 100).toFixed(2);
    expect(formatted).toBe('89.00');
  });
});
