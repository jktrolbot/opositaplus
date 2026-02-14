export interface ExtractedQuestionDraft {
  chunk_index?: number;
  question_text: string;
  options: Array<{ key: string; text: string }>;
  correct_answer: string;
  explanation?: string;
  difficulty?: number;
  tema?: string;
  subtema?: string;
  tags?: string[];
}

export interface ExtractedFlashcardDraft {
  chunk_index?: number;
  front: string;
  back: string;
  difficulty?: number;
  tema?: string;
  subtema?: string;
  tags?: string[];
}

export interface ChunkAnnotation {
  chunk_index: number;
  tema?: string;
  subtema?: string;
  difficulty?: string;
  tags?: string[];
  resumen?: string;
}

export interface StudyMaterialDraft {
  chunk_annotations: ChunkAnnotation[];
  summaries: Array<{
    tema: string;
    subtema?: string;
    resumen: string;
    difficulty?: string;
    tags?: string[];
  }>;
  questions: ExtractedQuestionDraft[];
  flashcards: ExtractedFlashcardDraft[];
}

export interface QualityValidationResult {
  question_id?: string;
  index?: number;
  score: number;
  valid: boolean;
  reason?: string;
}
