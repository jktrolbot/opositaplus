'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useOrganization } from '@/lib/hooks/use-organization';
import { normalizeRole } from '@/lib/auth/roles';
import { QuestionEditor } from '@/components/centro/question-editor';
import { getUnvalidatedQuestions, validateQuestion, updateQuestion, deleteQuestion } from '@/lib/actions/questions';

interface QuestionRow {
  id: string;
  question_text: string;
  options: { key: string; text: string }[];
  correct_answer: string;
  explanation: string | null;
  difficulty: number;
}

export default function ValidarPage() {
  const { organization, userRole, isLoading: orgLoading } = useOrganization();
  const normalizedRole = normalizeRole(userRole);
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organization) return;
    getUnvalidatedQuestions(organization.id)
      .then((data) => setQuestions((data ?? []) as unknown as QuestionRow[]))
      .finally(() => setLoading(false));
  }, [organization]);

  if (orgLoading || loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#1B3A5C]" />
      </div>
    );
  }

  if (normalizedRole !== 'centro_admin' && normalizedRole !== 'profesor' && normalizedRole !== 'super_admin') {
    return <p className="text-slate-500">No tienes acceso a esta sección.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1B3A5C]">Validar preguntas IA</h1>
        <p className="text-sm text-slate-500">{questions.length} preguntas pendientes de validación</p>
      </div>

      {questions.length === 0 ? (
        <p className="text-sm text-slate-500">No hay preguntas pendientes de validación.</p>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => (
            <QuestionEditor
              key={q.id}
              id={q.id}
              questionText={q.question_text}
              options={q.options}
              correctAnswer={q.correct_answer}
              explanation={q.explanation}
              difficulty={q.difficulty}
              onValidate={async (id, validated) => {
                await validateQuestion(id, validated);
                setQuestions((prev) => prev.filter((p) => p.id !== id));
              }}
              onUpdate={async (id, data) => {
                await updateQuestion(id, data);
              }}
              onDelete={async (id) => {
                await deleteQuestion(id);
                setQuestions((prev) => prev.filter((p) => p.id !== id));
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
