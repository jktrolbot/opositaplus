'use server';

import { createClient } from '@/lib/supabase/server';

export async function getStudents(organizationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('organization_members')
    .select('*, user_profiles(full_name, avatar_url, phone)')
    .eq('organization_id', organizationId)
    .eq('role', 'student')
    .order('joined_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getStudentProfile(organizationId: string, userId: string) {
  const supabase = await createClient();

  const [memberResult, profileResult, progressResult] = await Promise.all([
    supabase
      .from('organization_members')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .single(),
    supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single(),
    supabase
      .from('study_progress')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('user_id', userId),
  ]);

  return {
    member: memberResult.data,
    profile: profileResult.data,
    progress: progressResult.data ?? [],
  };
}

export async function inviteStudent(organizationId: string, email: string) {
  const supabase = await createClient();

  // Check if user exists
  // Note: in production, you'd use admin API or send invitation email
  // For now, create a placeholder membership once user registers
  return { success: true, email };
}

export async function removeStudent(organizationId: string, userId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('organization_members')
    .delete()
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .eq('role', 'student');

  if (error) throw new Error(error.message);
  return { success: true };
}
