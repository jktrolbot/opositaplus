import { describe, expect, it } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  canAccess,
  getHighestRole,
  getUserRole,
  isAdmin,
  normalizeRole,
} from '@/lib/auth/roles';

type MockProfile = {
  id: string;
  role: string | null;
  is_super_admin: boolean;
};

type MockMembership = {
  user_id: string;
  role: string;
  status: string;
};

function createMockRoleClient({
  authUserId,
  profiles = [],
  memberships = [],
}: {
  authUserId?: string | null;
  profiles?: MockProfile[];
  memberships?: MockMembership[];
}): Pick<SupabaseClient, 'auth' | 'from'> {
  return {
    auth: {
      getUser: async () => ({
        data: {
          user: authUserId ? ({ id: authUserId } as { id: string }) : null,
        },
        error: null,
      }),
    },
    from: (table: string) => {
      const filters = new Map<string, unknown>();

      const runSelect = () => {
        if (table === 'organization_members') {
          const rows = memberships.filter((row) => {
            const userIdFilter = filters.get('user_id');
            const statusFilter = filters.get('status');
            const matchesUser = userIdFilter ? row.user_id === userIdFilter : true;
            const matchesStatus = statusFilter ? row.status === statusFilter : true;
            return matchesUser && matchesStatus;
          });
          return { data: rows.map((row) => ({ role: row.role })) };
        }

        return { data: null };
      };

      const query = {
        select: () => query,
        eq: (column: string, value: unknown) => {
          filters.set(column, value);
          return query;
        },
        maybeSingle: async () => {
          if (table !== 'user_profiles') return { data: null };

          const idFilter = filters.get('id');
          const profile = profiles.find((row) => row.id === idFilter) ?? null;
          return { data: profile };
        },
        then: (onfulfilled: (value: { data: unknown }) => unknown, onrejected?: (reason: unknown) => unknown) =>
          Promise.resolve(runSelect()).then(onfulfilled, onrejected),
      };

      return query;
    },
  } as unknown as Pick<SupabaseClient, 'auth' | 'from'>;
}

describe('auth role helpers', () => {
  it('normalizes canonical and legacy roles', () => {
    expect(normalizeRole('super_admin')).toBe('super_admin');
    expect(normalizeRole('center_admin')).toBe('centro_admin');
    expect(normalizeRole('teacher')).toBe('profesor');
    expect(normalizeRole('student')).toBe('alumno');
  });

  it('detects admin roles correctly', () => {
    expect(isAdmin('super_admin')).toBe(true);
    expect(isAdmin('center_admin')).toBe(true);
    expect(isAdmin('profesor')).toBe(false);
  });

  it('evaluates access matrix by role/resource/action', () => {
    expect(canAccess('global_panel', 'manage', 'super_admin')).toBe(true);
    expect(canAccess('question_validation', 'validate', 'profesor')).toBe(true);
    expect(canAccess('kb_chunks', 'read', 'alumno')).toBe(false);
    expect(canAccess('tests', 'read', 'alumno')).toBe(true);
  });

  it('returns highest role by priority', () => {
    expect(getHighestRole(['student', 'teacher'])).toBe('profesor');
    expect(getHighestRole(['alumno', 'centro_admin'])).toBe('centro_admin');
  });

  it('resolves role from user profile first', async () => {
    const client = createMockRoleClient({
      profiles: [{ id: 'u1', role: 'center_admin', is_super_admin: false }],
      memberships: [{ user_id: 'u1', role: 'student', status: 'active' }],
    });

    await expect(getUserRole(client, 'u1')).resolves.toBe('centro_admin');
  });

  it('falls back to memberships and defaults to alumno', async () => {
    const fromMemberships = createMockRoleClient({
      profiles: [{ id: 'u2', role: null, is_super_admin: false }],
      memberships: [{ user_id: 'u2', role: 'teacher', status: 'active' }],
    });
    await expect(getUserRole(fromMemberships, 'u2')).resolves.toBe('profesor');

    const noRole = createMockRoleClient({
      profiles: [{ id: 'u3', role: null, is_super_admin: false }],
      memberships: [],
    });
    await expect(getUserRole(noRole, 'u3')).resolves.toBe('alumno');
  });

  it('reads current authenticated user when userId is omitted', async () => {
    const client = createMockRoleClient({
      authUserId: 'u4',
      profiles: [{ id: 'u4', role: null, is_super_admin: true }],
      memberships: [],
    });

    await expect(getUserRole(client)).resolves.toBe('super_admin');
  });
});
