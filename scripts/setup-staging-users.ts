/**
 * Setup staging demo users for CIP Formación presentation
 *
 * Usage:
 *   npx tsx scripts/setup-staging-users.ts
 *
 * Requires env vars:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "❌ Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const CIP_ORG_ID = "c0000000-0000-0000-0000-000000000001";
const PASSWORD = "Demo2026!";

interface DemoUser {
  email: string;
  fullName: string;
  isSuperAdmin: boolean;
  orgRole?: "center_admin" | "teacher" | "student";
}

const DEMO_USERS: DemoUser[] = [
  {
    email: "admin@opositaplus.com",
    fullName: "Admin OpositaPlus",
    isSuperAdmin: true,
  },
  {
    email: "centro@cipformacion.com",
    fullName: "María García López",
    isSuperAdmin: false,
    orgRole: "center_admin",
  },
  {
    email: "profesor@cipformacion.com",
    fullName: "Carlos Rodríguez Fernández",
    isSuperAdmin: false,
    orgRole: "teacher",
  },
  {
    email: "alumno@cipformacion.com",
    fullName: "Laura Pérez Sánchez",
    isSuperAdmin: false,
    orgRole: "student",
  },
  {
    email: "test@opositaplus.com",
    fullName: "Test User (Demo)",
    isSuperAdmin: true,
  },
];

async function createOrGetUser(email: string): Promise<string | null> {
  // Check if user exists
  const { data: existingUsers } =
    await supabase.auth.admin.listUsers();
  const existing = existingUsers?.users?.find((u) => u.email === email);
  if (existing) {
    console.log(`  ✅ User ${email} already exists (${existing.id})`);
    return existing.id;
  }

  // Create user
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { source: "staging-seed" },
  });

  if (error) {
    console.error(`  ❌ Failed to create ${email}:`, error.message);
    return null;
  }

  console.log(`  ✅ Created ${email} (${data.user.id})`);
  return data.user.id;
}

async function setupProfile(
  userId: string,
  fullName: string,
  isSuperAdmin: boolean
) {
  const { error } = await supabase.from("user_profiles").upsert(
    {
      id: userId,
      full_name: fullName,
      is_super_admin: isSuperAdmin,
    },
    { onConflict: "id" }
  );

  if (error) {
    console.error(`  ❌ Profile error for ${userId}:`, error.message);
  } else {
    console.log(
      `  ✅ Profile set: ${fullName} (super_admin=${isSuperAdmin})`
    );
  }
}

async function setupOrgMembership(
  userId: string,
  role: string,
  orgId: string
) {
  const { error } = await supabase.from("organization_members").upsert(
    {
      organization_id: orgId,
      user_id: userId,
      role,
      status: "active",
    },
    { onConflict: "organization_id,user_id,role" }
  );

  if (error) {
    console.error(`  ❌ Membership error:`, error.message);
  } else {
    console.log(`  ✅ Org membership: ${role} @ CIP Formación`);
  }
}

async function setupSubscription(userId: string) {
  // Give the alumno a subscription to Xunta A1
  const { error } = await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      organization_id: CIP_ORG_ID,
      plan_id: "d0000000-0000-0000-0000-000000000001", // Plan Mensual Xunta A1
      status: "active",
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
    },
    { onConflict: "id" }
  );

  if (error && !error.message.includes("duplicate")) {
    console.error(`  ⚠️ Subscription:`, error.message);
  } else {
    console.log(`  ✅ Active subscription to Plan Mensual Xunta A1`);
  }
}

async function main() {
  console.log("🚀 Setting up staging demo users for CIP Formación\n");

  for (const user of DEMO_USERS) {
    console.log(`\n👤 ${user.fullName} (${user.email})`);

    const userId = await createOrGetUser(user.email);
    if (!userId) continue;

    await setupProfile(userId, user.fullName, user.isSuperAdmin);

    if (user.orgRole) {
      await setupOrgMembership(userId, user.orgRole, CIP_ORG_ID);
    }

    // Give test user all org roles for demo purposes
    if (user.email === "test@opositaplus.com") {
      await setupOrgMembership(userId, "center_admin", CIP_ORG_ID);
    }

    // Give alumno and test user a subscription
    if (user.orgRole === "student" || user.email === "test@opositaplus.com") {
      await setupSubscription(userId);
    }
  }

  console.log("\n✅ Staging setup complete!\n");
  console.log("📋 Demo credentials:");
  console.log("   Password for all users: Demo2026!");
  console.log("   admin@opositaplus.com     → super_admin");
  console.log("   centro@cipformacion.com   → centro_admin (CIP)");
  console.log("   profesor@cipformacion.com → profesor (CIP)");
  console.log("   alumno@cipformacion.com   → alumno (CIP)");
  console.log("   test@opositaplus.com      → super_admin + all access");
}

main().catch(console.error);
