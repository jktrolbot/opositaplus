'use server';

import { createClient } from '@/lib/supabase/server';

export async function getUnvalidatedQuestions(organizationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('questions')
    .select('*, topics(title)')
    .eq('organization_id', organizationId)
    .eq('ai_validated', false)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function validateQuestion(questionId: string, validated: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('questions')
    .update({ ai_validated: validated })
    .eq('id', questionId);

  if (error) throw new Error(error.message);
  return { success: true };
}

export async function updateQuestion(questionId: string, data: {
  question_text?: string;
  options?: unknown;
  correct_answer?: string;
  explanation?: string;
  difficulty?: number;
}) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('questions')
    .update(data)
    .eq('id', questionId);

  if (error) throw new Error(error.message);
  return { success: true };
}

export async function deleteQuestion(questionId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', questionId);

  if (error) throw new Error(error.message);
  return { success: true };
}
