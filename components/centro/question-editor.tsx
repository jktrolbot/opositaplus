'use client';

import { useState } from 'react';
import { Check, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

interface QuestionOption {
  key: string;
  text: string;
}

interface QuestionEditorProps {
  id: string;
  questionText: string;
  options: QuestionOption[];
  correctAnswer: string;
  explanation: string | null;
  difficulty: number;
  onValidate: (id: string, validated: boolean) => Promise<void>;
  onUpdate: (id: string, data: Record<string, unknown>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function QuestionEditor({
  id,
  questionText,
  options,
  correctAnswer,
  explanation,
  difficulty,
  onValidate,
  onUpdate,
  onDelete,
}: QuestionEditorProps) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(questionText);
  const [editExplanation, setEditExplanation] = useState(explanation ?? '');

  const handleSave = async () => {
    await onUpdate(id, { question_text: text, explanation: editExplanation });
    setEditing(false);
  };

  return (
    <Card className="border-slate-200">
      <CardContent className="space-y-3 pt-4">
        {editing ? (
          <div className="space-y-2">
            <Input value={text} onChange={(e) => setText(e.target.value)} />
            <Input
              value={editExplanation}
              onChange={(e) => setEditExplanation(e.target.value)}
              placeholder="Explicación"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave}>Guardar</Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
            </div>
          </div>
        ) : (
          <>
            <p className="font-medium text-slate-900">{questionText}</p>
            <div className="grid gap-1 sm:grid-cols-2">
              {options.map((opt) => (
                <div
                  key={opt.key}
                  className={`rounded-md border px-3 py-1.5 text-sm ${
                    opt.key === correctAnswer
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <strong>{opt.key}.</strong> {opt.text}
                </div>
              ))}
            </div>
            {explanation && (
              <p className="text-sm text-slate-500 italic">{explanation}</p>
            )}
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Dificultad: {difficulty}/5</span>
            </div>
          </>
        )}

        <div className="flex gap-2 border-t border-slate-100 pt-2">
          <Button size="sm" variant="outline" onClick={() => onValidate(id, true)}>
            <Check className="mr-1 h-3 w-3" />
            Validar
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEditing(!editing)}>
            <Pencil className="mr-1 h-3 w-3" />
            Editar
          </Button>
          <Button size="sm" variant="outline" className="text-rose-500" onClick={() => onDelete(id)}>
            <Trash2 className="mr-1 h-3 w-3" />
            Eliminar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
