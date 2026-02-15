'use server';

import { createClient } from '@/lib/supabase/server';

export async function getTeachers(organizationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('organization_members')
    .select('*, user_profiles(full_name, avatar_url, phone)')
    .eq('organization_id', organizationId)
    .in('role', ['teacher', 'profesor'])
    .order('joined_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function addTeacher(organizationId: string, userId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('organization_members')
    .insert({ organization_id: organizationId, user_id: userId, role: 'profesor' });

  if (error) throw new Error(error.message);
  return { success: true };
}

export async function removeTeacher(organizationId: string, userId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('organization_members')
    .delete()
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .in('role', ['teacher', 'profesor']);

  if (error) throw new Error(error.message);
  return { success: true };
}

export async function getTopics(organizationId: string, oppositionId?: string) {
  const supabase = await createClient();
  let query = supabase
    .from('topics')
    .select('*')
    .eq('organization_id', organizationId)
    .order('sort_order');

  if (oppositionId) {
    query = query.eq('opposition_id', oppositionId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

export async function createTopic(data: {
  organization_id: string;
  opposition_id: string;
  title: string;
  description?: string;
  parent_id?: string;
  sort_order?: number;
}) {
  const supabase = await createClient();
  const { data: topic, error } = await supabase
    .from('topics')
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return topic;
}

export async function getResources(organizationId: string, topicId?: string) {
  const supabase = await createClient();
  let query = supabase
    .from('resources')
    .select('*')
    .eq('organization_id', organizationId)
    .order('sort_order');

  if (topicId) {
    query = query.eq('topic_id', topicId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

export async function createResource(data: {
  organization_id: string;
  opposition_id: string;
  topic_id?: string;
  title: string;
  type: string;
  url?: string;
  file_size?: number;
  mime_type?: string;
}) {
  const supabase = await createClient();
  const { data: resource, error } = await supabase
    .from('resources')
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return resource;
}

export async function deleteResource(resourceId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('resources')
    .delete()
    .eq('id', resourceId);

  if (error) throw new Error(error.message);
  return { success: true };
}
