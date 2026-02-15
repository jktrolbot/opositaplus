import type { SupabaseClient } from '@supabase/supabase-js';

export const APP_ROLES = ['super_admin', 'centro_admin', 'profesor', 'alumno'] as const;
export type AppRole = (typeof APP_ROLES)[number];
export type LegacyRole = 'center_admin' | 'teacher' | 'student';
export type RoleLike = AppRole | LegacyRole | null | undefined;

export type AuthResource =
  | 'global_panel'
  | 'center'
  | 'kb'
  | 'kb_raw'
  | 'kb_chunks'
  | 'questions'
  | 'question_validation'
  | 'tests'
  | 'flashcards';

export type AuthAction = 'read' | 'write' | 'manage' | 'validate';

const ROLE_ALIAS_MAP: Record<string, AppRole> = {
  super_admin: 'super_admin',
  center_admin: 'centro_admin',
  centro_admin: 'centro_admin',
  teacher: 'profesor',
  profesor: 'profesor',
  student: 'alumno',
  alumno: 'alumno',
};

const ROLE_PRIORITY: Record<AppRole, number> = {
  super_admin: 4,
  centro_admin: 3,
  profesor: 2,
  alumno: 1,
};

const ACCESS_MATRIX: Record<AuthResource, Partial<Record<AuthAction, readonly AppRole[]>>> = {
  global_panel: {
    read: ['super_admin'],
    manage: ['super_admin'],
  },
  center: {
    read: ['super_admin', 'centro_admin', 'profesor'],
    manage: ['super_admin', 'centro_admin'],
  },
  kb: {
    read: ['super_admin', 'centro_admin', 'profesor'],
    write: ['super_admin', 'centro_admin', 'profesor'],
    manage: ['super_admin', 'centro_admin'],
  },
  kb_raw: {
    read: ['super_admin', 'centro_admin', 'profesor'],
    write: ['super_admin', 'centro_admin', 'profesor'],
    manage: ['super_admin', 'centro_admin'],
  },
  kb_chunks: {
    read: ['super_admin', 'centro_admin', 'profesor'],
    write: ['super_admin', 'centro_admin', 'profesor'],
    manage: ['super_admin', 'centro_admin'],
  },
  questions: {
    read: ['super_admin', 'centro_admin', 'profesor'],
    write: ['super_admin', 'centro_admin', 'profesor'],
    manage: ['super_admin', 'centro_admin'],
  },
  question_validation: {
    read: ['super_admin', 'centro_admin', 'profesor'],
    validate: ['super_admin', 'centro_admin', 'profesor'],
    manage: ['super_admin', 'centro_admin'],
  },
  tests: {
    read: ['super_admin', 'centro_admin', 'profesor', 'alumno'],
    write: ['super_admin', 'centro_admin', 'profesor', 'alumno'],
  },
  flashcards: {
    read: ['super_admin', 'centro_admin', 'profesor', 'alumno'],
    write: ['super_admin', 'centro_admin', 'profesor'],
  },
};

export function normalizeRole(role: string | RoleLike): AppRole | null {
  if (!role) return null;
  const normalized = ROLE_ALIAS_MAP[String(role).trim().toLowerCase()];
  return normalized ?? null;
}

export function getHighestRole(roles: Array<string | RoleLike>): AppRole | null {
  let best: AppRole | null = null;
  for (const role of roles) {
    const normalized = normalizeRole(role);
    if (!normalized) continue;
    if (!best || ROLE_PRIORITY[normalized] > ROLE_PRIORITY[best]) {
      best = normalized;
    }
  }
  return best;
}

export function isAdmin(role: string | RoleLike): boolean {
  const normalized = normalizeRole(role);
  return normalized === 'super_admin' || normalized === 'centro_admin';
}

export function canAccess(
  resource: AuthResource,
  action: AuthAction = 'read',
  role?: string | RoleLike,
): boolean {
  const normalized = normalizeRole(role);
  if (!normalized) return false;

  const byResource = ACCESS_MATRIX[resource];
  const allowedRoles = byResource[action] ?? [];
  return allowedRoles.includes(normalized);
}

type ProfileRoleRow = {
  role: string | null;
  is_super_admin: boolean | null;
};

type MembershipRoleRow = {
  role: string | null;
};

type RoleSupabaseClient = Pick<SupabaseClient, 'auth' | 'from'>;

export async function getUserRole(client: RoleSupabaseClient, userId?: string): Promise<AppRole | null> {
  let targetUserId = userId;
  if (!targetUserId) {
    const {
      data: { user },
      error,
    } = await client.auth.getUser();
    if (error || !user) return null;
    targetUserId = user.id;
  }

  const { data: profileData } = await client
    .from('user_profiles')
    .select('role, is_super_admin')
    .eq('id', targetUserId)
    .maybeSingle();
  const profile = profileData as ProfileRoleRow | null;

  if (profile?.is_super_admin) return 'super_admin';
  const roleFromProfile = normalizeRole(profile?.role ?? null);
  if (roleFromProfile) return roleFromProfile;

  const { data: membershipData } = await client
    .from('organization_members')
    .select('role')
    .eq('user_id', targetUserId)
    .eq('status', 'active');

  const memberships = (membershipData ?? []) as MembershipRoleRow[];
  const roleFromMemberships = getHighestRole(memberships.map((membership) => membership.role));
  return roleFromMemberships ?? 'alumno';
}
