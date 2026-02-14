import type { QualityValidationResult, StudyMaterialDraft } from '@/lib/knowledge/types';
import { summarizeChunkForPrompt } from '@/lib/knowledge/chunking';

const GEMINI_VISION_FALLBACKS = ['gemini-3-pro', 'gemini-2.5-pro', 'gemini-1.5-pro'];
const GEMINI_FLASH_FALLBACKS = ['gemini-2.5-flash', 'gemini-2.0-flash'];

function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} no está configurada`);
  }
  return value;
}

function toBase64(buffer: Buffer) {
  return buffer.toString('base64');
}

function safeJsonParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    const fenced = raw.match(/```json\s*([\s\S]*?)\s*```/i);
    if (fenced?.[1]) {
      try {
        return JSON.parse(fenced[1]) as T;
      } catch {
        return null;
      }
    }

    const firstBrace = raw.indexOf('{');
    const lastBrace = raw.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(raw.slice(firstBrace, lastBrace + 1)) as T;
      } catch {
        return null;
      }
    }

    return null;
  }
}

async function callGemini(
  modelCandidates: string[],
  payload: {
    prompt: string;
    inlineData?: Array<{ mimeType: string; data: string }>;
    temperature?: number;
    expectJson?: boolean;
  },
) {
  const apiKey = requireEnv('GOOGLE_AI_API_KEY');
  const errors: string[] = [];

  for (const model of modelCandidates) {
    try {
      const parts: Array<Record<string, unknown>> = [{ text: payload.prompt }];
      for (const item of payload.inlineData ?? []) {
        parts.push({ inlineData: item });
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts }],
            generationConfig: {
              temperature: payload.temperature ?? 0.2,
              ...(payload.expectJson ? { responseMimeType: 'application/json' } : {}),
            },
          }),
        },
      );

      if (!response.ok) {
        const text = await response.text();
        errors.push(`${model}: ${response.status} ${text}`);
        continue;
      }

      const data = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };

      const text =
        data.candidates?.[0]?.content?.parts
          ?.map((part) => part.text ?? '')
          .join('\n')
          .trim() ?? '';

      if (!text) {
        errors.push(`${model}: respuesta vacía`);
        continue;
      }

      return { text, model };
    } catch (error) {
      errors.push(`${model}: ${(error as Error).message}`);
    }
  }

  throw new Error(`Gemini falló en todos los modelos: ${errors.join(' | ')}`);
}

function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  return tags
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
    .slice(0, 12);
}

function normalizeDifficulty(value: unknown, fallback = 3) {
  if (typeof value !== 'number') return fallback;
  if (!Number.isFinite(value)) return fallback;
  return Math.max(1, Math.min(5, Math.round(value)));
}

export async function extractTextWithGeminiVision(args: {
  bytes: Buffer;
  mimeType: string;
  fileName: string;
  extractQuestions?: boolean;
}) {
  if (args.bytes.length > 18 * 1024 * 1024) {
    throw new Error('Archivo demasiado grande para extracción Gemini (máx. 18MB por bloque)');
  }

  const modePrompt = args.extractQuestions
    ? 'Además, detecta preguntas tipo test preexistentes y devuélvelas estructuradas.'
    : 'No inventes contenido, extrae únicamente lo presente en el documento.';

  const prompt = [
    'Eres un extractor documental para oposiciones en España.',
    `Archivo: ${args.fileName}`,
    'Devuelve SOLO JSON con esta forma:',
    '{',
    '  "raw_text": "texto completo extraído",',
    '  "tema": "tema principal",',
    '  "subtema": "subtema",',
    '  "difficulty": "baja|media|alta",',
    '  "tags": ["tag1", "tag2"],',
    '  "detected_questions": [',
    '    {',
    '      "question_text": "...",',
    '      "options": [{"key":"A","text":"..."},{"key":"B","text":"..."},{"key":"C","text":"..."},{"key":"D","text":"..."}],',
    '      "correct_answer": "A",',
    '      "explanation": "...",',
    '      "difficulty": 3,',
    '      "tags": ["..."]',
    '    }',
    '  ]',
    '}',
    modePrompt,
  ].join('\n');

  const { text, model } = await callGemini(
    [process.env.GEMINI_VISION_MODEL ?? GEMINI_VISION_FALLBACKS[0], ...GEMINI_VISION_FALLBACKS],
    {
      prompt,
      inlineData: [{ mimeType: args.mimeType, data: toBase64(args.bytes) }],
      expectJson: true,
      temperature: 0.1,
    },
  );

  const parsed = safeJsonParse<{
    raw_text?: string;
    tema?: string;
    subtema?: string;
    difficulty?: string;
    tags?: string[];
    detected_questions?: Array<{
      question_text?: string;
      options?: Array<{ key?: string; text?: string }>;
      correct_answer?: string;
      explanation?: string;
      difficulty?: number;
      tags?: string[];
    }>;
  }>(text);

  if (!parsed?.raw_text || parsed.raw_text.trim().length < 20) {
    throw new Error(`Gemini no extrajo texto útil (${model})`);
  }

  return {
    rawText: parsed.raw_text.trim(),
    tema: parsed.tema?.trim() || null,
    subtema: parsed.subtema?.trim() || null,
    difficulty: parsed.difficulty?.trim() || null,
    tags: normalizeTags(parsed.tags),
    detectedQuestions:
      parsed.detected_questions
        ?.map((question) => {
          const options = (question.options ?? [])
            .map((option) => ({
              key: (option.key ?? '').trim(),
              text: (option.text ?? '').trim(),
            }))
            .filter((option) => option.key && option.text)
            .slice(0, 4);

          if (
            !question.question_text ||
            !question.correct_answer ||
            options.length < 2
          ) {
            return null;
          }

          return {
            question_text: question.question_text.trim(),
            options,
            correct_answer: question.correct_answer.trim(),
            explanation: question.explanation?.trim() || null,
            difficulty: normalizeDifficulty(question.difficulty),
            tags: normalizeTags(question.tags),
          };
        })
        .filter(isDefined) ?? [],
    model,
  };
}

export async function summarizeFramesWithGemini(args: {
  frames: Array<{ mimeType: string; bytes: Buffer }>;
  fileName: string;
}) {
  if (args.frames.length === 0) {
    return {
      visualSummary: '',
      tags: [] as string[],
    };
  }

  const inlineData = args.frames.map((frame) => ({
    mimeType: frame.mimeType,
    data: toBase64(frame.bytes),
  }));

  const prompt = [
    `Analiza frames clave del vídeo ${args.fileName}.`,
    'Devuelve SOLO JSON: {"visual_summary":"...","tags":["..."]}.',
    'Extrae texto visible, diapositivas, tablas o normativas que aporten contexto de estudio.',
  ].join('\n');

  const { text } = await callGemini(
    [process.env.GEMINI_VISION_MODEL ?? GEMINI_VISION_FALLBACKS[0], ...GEMINI_VISION_FALLBACKS],
    {
      prompt,
      inlineData,
      expectJson: true,
      temperature: 0.1,
    },
  );

  const parsed = safeJsonParse<{ visual_summary?: string; tags?: string[] }>(text);
  return {
    visualSummary: parsed?.visual_summary?.trim() ?? '',
    tags: normalizeTags(parsed?.tags),
  };
}

export async function transcribeWithAssemblyAI(args: {
  fileUrl?: string;
  bytes?: Buffer;
  mimeType?: string;
}) {
  const apiKey = requireEnv('ASSEMBLYAI_API_KEY');

  let audioUrl = args.fileUrl;

  if (!audioUrl && args.bytes) {
    const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        Authorization: apiKey,
        'Transfer-Encoding': 'chunked',
        'Content-Type': args.mimeType ?? 'application/octet-stream',
      },
      body: new Uint8Array(args.bytes),
    });

    if (!uploadResponse.ok) {
      throw new Error(`AssemblyAI upload falló: ${uploadResponse.status} ${await uploadResponse.text()}`);
    }

    const uploadData = (await uploadResponse.json()) as { upload_url?: string };
    if (!uploadData.upload_url) {
      throw new Error('AssemblyAI no devolvió upload_url');
    }
    audioUrl = uploadData.upload_url;
  }

  if (!audioUrl) {
    throw new Error('No se proporcionó audio para transcribir');
  }

  const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
    method: 'POST',
    headers: {
      Authorization: apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      audio_url: audioUrl,
      language_code: 'es',
      speech_model: 'universal',
      punctuate: true,
      format_text: true,
    }),
  });

  if (!transcriptResponse.ok) {
    throw new Error(`AssemblyAI transcript request falló: ${transcriptResponse.status} ${await transcriptResponse.text()}`);
  }

  const transcriptData = (await transcriptResponse.json()) as { id?: string };
  if (!transcriptData.id) {
    throw new Error('AssemblyAI no devolvió transcript id');
  }

  for (let attempt = 0; attempt < 120; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 4000));
    const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptData.id}`, {
      headers: { Authorization: apiKey },
    });

    if (!statusResponse.ok) {
      throw new Error(`AssemblyAI polling falló: ${statusResponse.status}`);
    }

    const statusData = (await statusResponse.json()) as {
      status?: string;
      text?: string;
      error?: string;
      confidence?: number;
    };

    if (statusData.status === 'completed' && statusData.text) {
      return {
        text: statusData.text.trim(),
        confidence: statusData.confidence ?? null,
        transcriptId: transcriptData.id,
      };
    }

    if (statusData.status === 'error') {
      throw new Error(`AssemblyAI devolvió error: ${statusData.error ?? 'sin detalle'}`);
    }
  }

  throw new Error('AssemblyAI timeout esperando transcripción');
}

export async function generateGeminiEmbedding(text: string) {
  const apiKey = requireEnv('GOOGLE_AI_API_KEY');
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: {
          parts: [{ text }],
        },
        taskType: 'RETRIEVAL_DOCUMENT',
        outputDimensionality: 1536,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Gemini embedding falló: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as { embedding?: { values?: number[] } };
  const values = data.embedding?.values;

  if (!Array.isArray(values) || values.length === 0) {
    throw new Error('Gemini embedding devolvió vector vacío');
  }

  if (values.length === 1536) {
    return values;
  }

  if (values.length > 1536) {
    return values.slice(0, 1536);
  }

  const padded = [...values];
  while (padded.length < 1536) padded.push(0);
  return padded;
}

export async function generateStudyMaterialDraft(args: {
  chunks: string[];
  fileName: string;
  oposicionName?: string;
}) {
  const compactChunks = args.chunks
    .slice(0, 24)
    .map((chunk, index) => ({
      chunk_index: index,
      preview: summarizeChunkForPrompt(chunk, 580),
    }));

  const prompt = [
    'Eres generador de material didáctico para oposiciones en España.',
    `Archivo base: ${args.fileName}.`,
    `Oposición: ${args.oposicionName ?? 'No especificada'}.`,
    'A partir de los chunks, genera SOLO JSON con esta forma exacta:',
    '{',
    '  "chunk_annotations": [{"chunk_index":0,"tema":"...","subtema":"...","difficulty":"baja|media|alta","tags":["..."]}],',
    '  "summaries": [{"tema":"...","subtema":"...","resumen":"...","difficulty":"...","tags":["..."]}],',
    '  "questions": [{"chunk_index":0,"question_text":"...","options":[{"key":"A","text":"..."},{"key":"B","text":"..."},{"key":"C","text":"..."},{"key":"D","text":"..."}],"correct_answer":"A","explanation":"...","difficulty":3,"tema":"...","subtema":"...","tags":["..."]}],',
    '  "flashcards": [{"chunk_index":0,"front":"...","back":"...","difficulty":3,"tema":"...","subtema":"...","tags":["..."]}]',
    '}',
    'Reglas:',
    '- Preguntas de calidad de examen, sin ambigüedades.',
    '- Siempre 4 opciones para cada pregunta.',
    '- Mantén consistencia con normativa española cuando aplique.',
    '- No inventes datos fuera del material base.',
    `Chunks:\n${JSON.stringify(compactChunks)}`,
  ].join('\n');

  const { text } = await callGemini(
    [process.env.GEMINI_FLASH_MODEL ?? GEMINI_FLASH_FALLBACKS[0], ...GEMINI_FLASH_FALLBACKS],
    {
      prompt,
      expectJson: true,
      temperature: 0.2,
    },
  );

  const parsed = safeJsonParse<StudyMaterialDraft>(text);
  if (!parsed) {
    throw new Error('Gemini no devolvió JSON válido para material de estudio');
  }

  const normalized: StudyMaterialDraft = {
    chunk_annotations: Array.isArray(parsed.chunk_annotations)
      ? parsed.chunk_annotations
          .map((item) => ({
            chunk_index: Number.isFinite(item.chunk_index) ? Math.max(0, Math.floor(item.chunk_index)) : 0,
            tema: item.tema?.trim() || undefined,
            subtema: item.subtema?.trim() || undefined,
            difficulty: item.difficulty?.trim() || undefined,
            tags: normalizeTags(item.tags),
            resumen: item.resumen?.trim() || undefined,
          }))
          .slice(0, 200)
      : [],
    summaries: Array.isArray(parsed.summaries)
      ? parsed.summaries
          .map((item) => ({
            tema: item.tema?.trim() || 'General',
            subtema: item.subtema?.trim() || undefined,
            resumen: item.resumen?.trim() || '',
            difficulty: item.difficulty?.trim() || undefined,
            tags: normalizeTags(item.tags),
          }))
          .filter((item) => item.resumen.length > 0)
          .slice(0, 120)
      : [],
    questions: Array.isArray(parsed.questions)
      ? parsed.questions
          .map((item) => {
            const options = (item.options ?? [])
              .map((option) => ({
                key: option.key?.trim() || '',
                text: option.text?.trim() || '',
              }))
              .filter((option) => option.key && option.text)
              .slice(0, 4);

            if (!item.question_text?.trim() || !item.correct_answer?.trim() || options.length !== 4) {
              return null;
            }

            return {
              chunk_index:
                typeof item.chunk_index === 'number'
                  ? Math.max(0, Math.floor(item.chunk_index))
                  : undefined,
              question_text: item.question_text.trim(),
              options,
              correct_answer: item.correct_answer.trim(),
              explanation: item.explanation?.trim(),
              difficulty: normalizeDifficulty(item.difficulty),
              tema: item.tema?.trim(),
              subtema: item.subtema?.trim(),
              tags: normalizeTags(item.tags),
            };
          })
          .filter(isDefined)
          .slice(0, 300)
      : [],
    flashcards: Array.isArray(parsed.flashcards)
      ? parsed.flashcards
          .map((item) => {
            if (!item.front?.trim() || !item.back?.trim()) {
              return null;
            }
            return {
              chunk_index:
                typeof item.chunk_index === 'number'
                  ? Math.max(0, Math.floor(item.chunk_index))
                  : undefined,
              front: item.front.trim(),
              back: item.back.trim(),
              difficulty: normalizeDifficulty(item.difficulty),
              tema: item.tema?.trim(),
              subtema: item.subtema?.trim(),
              tags: normalizeTags(item.tags),
            };
          })
          .filter(isDefined)
          .slice(0, 400)
      : [],
  };

  return normalized;
}

export async function validateQuestionsWithClaude(args: {
  questions: Array<{
    id: string;
    question_text: string;
    options: Array<{ key: string; text: string }>;
    correct_answer: string;
    explanation?: string | null;
    chunk_text?: string | null;
  }>;
}) {
  const apiKey = requireEnv('ANTHROPIC_API_KEY');

  if (args.questions.length === 0) {
    return [] as QualityValidationResult[];
  }

  const payload = args.questions.slice(0, 180).map((question, index) => ({
    index,
    question_id: question.id,
    question_text: question.question_text,
    options: question.options,
    correct_answer: question.correct_answer,
    explanation: question.explanation,
    source_context: question.chunk_text,
  }));

  const prompt = [
    'Valida calidad de preguntas tipo test para oposiciones en España.',
    'Devuelve SOLO JSON:',
    '{"validations":[{"question_id":"...","index":0,"score":0-100,"valid":true|false,"reason":"..."}]}',
    'Criterios: exactitud, redacción, claridad de distractores, coherencia con contexto y normativa.',
    `Preguntas:\n${JSON.stringify(payload)}`,
  ].join('\n');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.CLAUDE_MODEL ?? 'claude-sonnet-4-5',
      max_tokens: 2500,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude validation falló: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };

  const text = data.content?.find((item) => item.type === 'text')?.text ?? '';
  if (!text) {
    throw new Error('Claude no devolvió texto de validación');
  }

  const parsed = safeJsonParse<{ validations?: QualityValidationResult[] }>(text);
  if (!parsed?.validations || !Array.isArray(parsed.validations)) {
    throw new Error('Claude devolvió formato inválido para validación');
  }

  return parsed.validations.map((item, index) => ({
    question_id: item.question_id,
    index: typeof item.index === 'number' ? item.index : index,
    score: Math.max(0, Math.min(100, Math.round(item.score ?? 0))),
    valid: Boolean(item.valid),
    reason: item.reason?.slice(0, 600),
  }));
}
