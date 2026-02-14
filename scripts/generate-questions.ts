#!/usr/bin/env npx tsx
/**
 * Generate questions from theory knowledge chunks.
 * Uses heuristic extraction — no AI APIs needed.
 */

import { Client } from 'pg';

const DB_URL = 'postgresql://postgres.bardmyaujaxmttxcczxi:13vOnqHbvzPqrZ0H@aws-1-eu-west-1.pooler.supabase.com:5432/postgres';

interface Chunk {
  id: string;
  tema: string | null;
  chunk_text: string;
  tags: string[];
  source_ref: string;
}

// Extract key concepts and generate questions
function generateQuestionsFromChunk(chunk: Chunk): Array<{
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  difficulty: number;
}> {
  const text = chunk.chunk_text;
  const questions: Array<{ question: string; options: string[]; correct_answer: string; explanation: string; difficulty: number }> = [];

  // 1. Definition questions: "X es/son/constituye..."
  const defPatterns = [
    /(?:^|\n)\s*(?:(?:La|El|Los|Las)\s+)?([A-ZÁÉÍÓÚ][^.]{10,60})\s+(?:es|son|constituye|se define como|se entiende por)\s+([^.]{20,200})\./gm,
    /(?:Se (?:entiende|considera|define)\s+(?:por|como)\s+)([^.]{10,60})\s+([^.]{20,200})\./gm,
  ];

  for (const pattern of defPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const concept = match[1].trim();
      const definition = match[2].trim();
      if (concept.length < 10 || definition.length < 20) continue;
      questions.push({
        question: `¿Qué ${concept.toLowerCase().startsWith('el ') || concept.toLowerCase().startsWith('la ') ? 'es' : 'se entiende por'} ${concept}?`,
        options: [],
        correct_answer: definition,
        explanation: `Según ${chunk.source_ref}: "${concept} ${match[0].includes('es') ? 'es' : 'se define como'} ${definition}"`,
        difficulty: 2,
      });
    }
  }

  // 2. Plazos/números: "plazo de X días/meses"
  const plazoPattern = /(?:plazo|período|periodo)\s+(?:de|máximo de|mínimo de)\s+(\d+)\s+(días|meses|años|horas)/gi;
  let plazoMatch;
  while ((plazoMatch = plazoPattern.exec(text)) !== null) {
    const context = text.substring(Math.max(0, plazoMatch.index - 100), plazoMatch.index).replace(/\n/g, ' ').trim();
    const lastSentence = context.split(/[.!?]\s+/).pop()?.trim();
    if (!lastSentence || lastSentence.length < 20) continue;

    questions.push({
      question: `¿Cuál es el plazo establecido para: "${lastSentence}"?`,
      options: [],
      correct_answer: `${plazoMatch[1]} ${plazoMatch[2]}`,
      explanation: `Fuente: ${chunk.source_ref}. El texto establece un plazo de ${plazoMatch[1]} ${plazoMatch[2]}.`,
      difficulty: 3,
    });
  }

  // 3. Artículos legales: "artículo X de la Ley Y"
  const artPattern = /(?:art(?:ículo)?\.?\s*)(\d+(?:\.\d+)?)\s+(?:de (?:la|el)\s+)?([A-Z][A-Za-záéíóúñ\s]{2,30})/gi;
  let artMatch;
  const artQuestions: typeof questions = [];
  while ((artMatch = artPattern.exec(text)) !== null) {
    const artNum = artMatch[1];
    const ley = artMatch[2].trim();
    const surroundingText = text.substring(Math.max(0, artMatch.index - 50), Math.min(text.length, artMatch.index + artMatch[0].length + 150)).replace(/\n/g, ' ').trim();
    
    if (surroundingText.length > 60) {
      artQuestions.push({
        question: `¿Qué regula el artículo ${artNum} de ${ley}?`,
        options: [],
        correct_answer: surroundingText.substring(0, 300),
        explanation: `Referencia legal: Art. ${artNum} ${ley}. Fuente: ${chunk.source_ref}`,
        difficulty: 3,
      });
    }
  }
  // Only add up to 2 article questions per chunk
  questions.push(...artQuestions.slice(0, 2));

  // 4. Porcentajes/tipos impositivos
  const tipoPattern = /(?:tipo|porcentaje|tanto por ciento)\s+(?:de(?:l)?|impositivo|general|reducido|superreducido)?\s*(?:del?\s*)?(\d+(?:[.,]\d+)?)\s*%/gi;
  let tipoMatch;
  while ((tipoMatch = tipoPattern.exec(text)) !== null) {
    const context = text.substring(Math.max(0, tipoMatch.index - 120), tipoMatch.index + tipoMatch[0].length + 50).replace(/\n/g, ' ').trim();
    if (context.length > 40) {
      questions.push({
        question: `¿Cuál es el tipo impositivo aplicable en el siguiente caso: "${context.substring(0, 200)}"?`,
        options: [],
        correct_answer: `${tipoMatch[1]}%`,
        explanation: `Fuente: ${chunk.source_ref}. Tipo: ${tipoMatch[1]}%.`,
        difficulty: 3,
      });
    }
  }

  // 5. Enumeration questions: "a) ... b) ... c) ..."
  const enumMatch = text.match(/(?:(?:son|serán|comprende|incluye)\s*:\s*\n?\s*)([a-z]\)[\s\S]{10,500}?)(?:\n\n|\n[A-Z])/);
  if (enumMatch) {
    const items = enumMatch[1].match(/[a-z]\)\s*[^a-z)]+/g);
    if (items && items.length >= 2) {
      const contextBefore = text.substring(Math.max(0, text.indexOf(enumMatch[0]) - 150), text.indexOf(enumMatch[0])).replace(/\n/g, ' ').trim();
      const lastSentence = contextBefore.split(/[.!?]\s+/).pop()?.trim();
      if (lastSentence && lastSentence.length > 15) {
        questions.push({
          question: `Enumere los elementos de: "${lastSentence}"`,
          options: items.map(i => i.trim()),
          correct_answer: items.map(i => i.trim()).join('; '),
          explanation: `Fuente: ${chunk.source_ref}. Se enumeran ${items.length} elementos.`,
          difficulty: 3,
        });
      }
    }
  }

  // 6. True/false from strong assertions
  const assertionPatterns = [
    /(?:^|\n)\s*(?:No\s+(?:podrá|será|tendrá|cabrá|procederá))\s+([^.]{20,200})\./gm,
    /(?:^|\n)\s*(?:Siempre|Nunca|En todo caso|En ningún caso)\s+([^.]{20,200})\./gm,
  ];

  for (const pattern of assertionPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const assertion = match[0].trim();
      if (assertion.length > 30 && assertion.length < 300) {
        questions.push({
          question: `¿Verdadero o falso? "${assertion}"`,
          options: ['Verdadero', 'Falso'],
          correct_answer: 'Verdadero',
          explanation: `Afirmación extraída directamente de: ${chunk.source_ref}`,
          difficulty: 2,
        });
      }
    }
  }

  // Limit to 3 questions per chunk to keep quality
  return questions.slice(0, 3);
}

async function main() {
  console.log('🧠 Generando preguntas desde chunks de teoría...\n');

  const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const opoId = '7b133694-59f5-4c5c-b941-2b904590cbfc';

  // Get all chunks without questions that have enough text
  const { rows: chunks } = await client.query<Chunk>(`
    SELECT kc.id, kc.tema, kc.chunk_text, kc.tags, kc.source_ref
    FROM knowledge_chunks kc
    WHERE kc.oposicion_id = $1
      AND length(kc.chunk_text) > 300
      AND NOT EXISTS (SELECT 1 FROM generated_questions gq WHERE gq.chunk_id = kc.id)
    ORDER BY kc.tema, kc.source_ref
  `, [opoId]);

  console.log(`📦 ${chunks.length} chunks sin preguntas\n`);

  let totalGenerated = 0;
  let chunksProcessed = 0;
  const questionsByTema: Record<string, number> = {};

  for (const chunk of chunks) {
    const questions = generateQuestionsFromChunk(chunk);
    if (questions.length === 0) continue;

    for (const q of questions) {
      await client.query(`
        INSERT INTO generated_questions (chunk_id, oposicion_id, question_text, options, correct_answer, explanation, difficulty, validated, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8)
      `, [
        chunk.id, opoId,
        q.question,
        JSON.stringify(q.options),
        q.correct_answer,
        q.explanation,
        q.difficulty,
        JSON.stringify({ source: chunk.source_ref, type: 'heuristic', autoGenerated: true }),
      ]);
      totalGenerated++;
      const tema = chunk.tema ?? 'Sin tema';
      questionsByTema[tema] = (questionsByTema[tema] ?? 0) + 1;
    }

    chunksProcessed++;
    if (chunksProcessed % 100 === 0) {
      console.log(`  → ${chunksProcessed}/${chunks.length} chunks, ${totalGenerated} preguntas generadas`);
    }
  }

  console.log('\n========================================');
  console.log('📊 Resumen de generación');
  console.log('========================================');
  console.log(`Chunks procesados: ${chunksProcessed}`);
  console.log(`Preguntas generadas: ${totalGenerated}`);
  console.log('\nPor tema:');
  for (const [tema, count] of Object.entries(questionsByTema).sort()) {
    console.log(`  ${tema}: ${count}`);
  }
  console.log('========================================\n');

  // Final count
  const { rows: [{ count }] } = await client.query('SELECT count(*)::int as count FROM generated_questions WHERE oposicion_id = $1', [opoId]);
  console.log(`📊 Total preguntas en BD: ${count}`);

  await client.end();
  console.log('✅ Hecho!');
}

main().catch(err => {
  console.error('💥 Error:', err);
  process.exit(1);
});
