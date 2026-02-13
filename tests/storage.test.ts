import { describe, it, expect } from 'vitest';

describe('Storage Utils', () => {
  it('should normalize slugs correctly', () => {
    const normalize = (slug: string) =>
      slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-') || 'general';

    expect(normalize('Xunta A1')).toBe('xunta-a1');
    expect(normalize('técnicos-hacienda')).toBe('t-cnicos-hacienda');
    expect(normalize('')).toBe('general');
    expect(normalize('  age-a1  ')).toBe('age-a1');
  });
});
