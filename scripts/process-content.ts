#!/usr/bin/env npx tsx
/**
 * Oposita+ Content Processing Pipeline
 * Processes CIP Formación PDFs → Supabase Knowledge Base
 * 
 * Usage: npx tsx scripts/process-content.ts
 */

import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
// @ts-ignore
import { createRequire } from 'module';
const require2 = createRequire(import.meta.url);
const pdfParse = require2('pdf-parse');
import { randomBytes } from 'crypto';

// ============================================================================
// Config
// ============================================================================
const DB_URL = 'postgresql://postgres.bardmyaujaxmttxcczxi:13vOnqHbvzPqrZ0H@aws-1-eu-west-1.pooler.supabase.com:5432/postgres';
const CONTENT_DIR = path.join(process.env.HOME || '/Users/trol', 'Downloads/cip-content');
const PDF_DIR = path.join(CONTENT_DIR, 'pdfs');
const FOLDERS_DIR = path.join(CONTENT_DIR, 'folders');

const CHUNK_SIZE = 800; // ~tokens per chunk
const CHUNK_OVERLAP = 100;

// ============================================================================
// Tema mapping from filenames
// ============================================================================
interface FileMapping {
  temas: string[];
  type: 'teoria' | 'practica' | 'examen' | 'legislacion' | 'temario';
  tags: string[];
  academicYear?: string;
}

function mapFilename(filename: string): FileMapping {
  const is2526 = filename.includes('25-26') || filename.includes('2025');
  const base: Partial<FileMapping> = {
    academicYear: is2526 ? '25-26' : '24-25',
  };

  // Practice/exam content
  if (filename.startsWith('Casos_Reales') || filename.startsWith('Casos_reales')) {
    const tags = ['práctica', 'casos reales'];
    if (filename.includes('Aduanas')) return { ...base, temas: ['33', '34', '35', '36'], type: 'practica', tags: [...tags, 'aduanas'] } as FileMapping;
    if (filename.includes('Recaudacion')) return { ...base, temas: ['10', '11'], type: 'practica', tags: [...tags, 'recaudación'] } as FileMapping;
    if (filename.includes('Tributos')) return { ...base, temas: ['4', '5', '6', '7', '8'], type: 'practica', tags: [...tags, 'tributos'] } as FileMapping;
    if (filename.includes('Inspeccion')) return { ...base, temas: ['12', '13'], type: 'practica', tags: [...tags, 'inspección'] } as FileMapping;
    return { ...base, temas: [], type: 'practica', tags } as FileMapping;
  }

  if (filename.includes('Supuestos')) {
    const tags = ['práctica', 'supuestos'];
    if (filename.includes('Aduanas')) return { ...base, temas: ['33', '34', '35', '36'], type: 'practica', tags: [...tags, 'aduanas'] } as FileMapping;
    if (filename.includes('IIEE')) return { ...base, temas: ['29', '30', '31'], type: 'practica', tags: [...tags, 'IIEE'] } as FileMapping;
    return { ...base, temas: [], type: 'practica', tags } as FileMapping;
  }

  if (filename.includes('Examen')) {
    return { ...base, temas: ['20'], type: 'examen', tags: ['examen', '3er ejercicio'] } as FileMapping;
  }

  // Tema-numbered files
  const temaMatch = filename.match(/^T(\d+)(?:[-_](\d+))?/);
  if (temaMatch) {
    const start = parseInt(temaMatch[1]);
    const end = temaMatch[2] ? parseInt(temaMatch[2]) : start;
    const temas = [];
    for (let i = start; i <= end; i++) temas.push(String(i));
    
    const tags: string[] = ['teoría'];
    if (filename.includes('IRPF')) tags.push('IRPF');
    if (filename.includes('IS')) tags.push('Impuesto de Sociedades');
    if (filename.includes('IVA')) tags.push('IVA');
    if (filename.includes('ITP')) tags.push('ITP y AJD');
    if (filename.includes('ISD')) tags.push('ISD');
    if (filename.includes('IIEE')) tags.push('IIEE');
    if (filename.includes('Aduanas')) tags.push('aduanas');
    if (filename.includes('Recaudacion')) tags.push('recaudación');
    if (filename.includes('Inspeccion')) tags.push('inspección');
    if (filename.includes('Delito')) tags.push('delito fiscal');
    if (filename.includes('Revision')) tags.push('revisión administrativa');
    if (filename.includes('Patrimonio')) tags.push('patrimonio');
    if (filename.includes('Esquemas')) tags.push('esquemas');
    
    return { ...base, temas, type: 'teoria', tags } as FileMapping;
  }

  // Special files
  if (filename.startsWith('Constitucion')) return { ...base, temas: ['1', '2'], type: 'teoria', tags: ['constitución', 'derecho presupuestario'] } as FileMapping;
  if (filename.startsWith('Proc_Tributarios')) {
    const tags = ['procedimientos tributarios'];
    if (filename.includes('Intro')) tags.push('introducción');
    if (filename.includes('Sumario')) tags.push('sumario');
    return { ...base, temas: ['1', '2', '3', '4', '5', '6', '7', '8'], type: 'teoria', tags } as FileMapping;
  }
  if (filename.startsWith('Texto_LGT')) return { ...base, temas: [], type: 'legislacion', tags: ['LGT', 'legislación'] } as FileMapping;
  if (filename.startsWith('Temario_DT')) return { ...base, temas: [], type: 'temario', tags: ['temario', 'índice'] } as FileMapping;
  if (filename.startsWith('Ley_38')) return { ...base, temas: ['29', '30', '31'], type: 'legislacion', tags: ['IIEE', 'legislación'] } as FileMapping;
  if (filename.startsWith('Reglamento_952')) return { ...base, temas: ['33', '34', '35', '36'], type: 'legislacion', tags: ['aduanas', 'CAU', 'legislación'] } as FileMapping;
  if (filename.includes('TARIC')) return { ...base, temas: ['33', '34', '35', '36'], type: 'teoria', tags: ['aduanas', 'TARIC'] } as FileMapping;
  if (filename.includes('ITP_AJD')) return { ...base, temas: ['27'], type: 'teoria', tags: ['ITP y AJD'] } as FileMapping;
  if (filename.includes('IIEE_Conceptos')) return { ...base, temas: ['29', '30', '31'], type: 'teoria', tags: ['IIEE', 'conceptos'] } as FileMapping;
  if (filename.includes('IIEE_Liquidacion')) return { ...base, temas: ['29', '30', '31'], type: 'teoria', tags: ['IIEE', 'liquidación'] } as FileMapping;
  if (filename.match(/^0\d{2}_Gestion/)) {
    return { ...base, temas: ['9'], type: 'teoria', tags: ['gestión tributaria', 'procedimientos'] } as FileMapping;
  }

  // Apuntes (class notes) - map by date/content
  if (filename.startsWith('Apuntes_')) {
    return { ...base, temas: [], type: 'teoria', tags: ['apuntes', 'clase'] } as FileMapping;
  }

  // Folder files
  if (filename.includes('Tema 4') || filename.includes('Tema 5')) {
    const t = filename.includes('Tema 4') ? '4' : '5';
    return { ...base, temas: [t], type: 'teoria', tags: ['teoría'] } as FileMapping;
  }
  if (filename.includes('Texto LGT')) return { ...base, temas: [], type: 'legislacion', tags: ['LGT', 'legislación'] } as FileMapping;
  if (filename.includes('Procedimientos Tributarios') && filename.includes('Sumario')) {
    return { ...base, temas: ['1', '2', '3', '4', '5', '6', '7', '8'], type: 'teoria', tags: ['procedimientos tributarios', 'sumario'] } as FileMapping;
  }
  if (filename.includes('Procedimientos Tributarios') && filename.includes('Introducción')) {
    return { ...base, temas: ['1', '2', '3', '4', '5', '6', '7', '8'], type: 'teoria', tags: ['procedimientos tributarios', 'introducción'] } as FileMapping;
  }
  if (filename.includes('Temario')) return { ...base, temas: [], type: 'temario', tags: ['temario', 'índice'] } as FileMapping;
  if (filename.includes('Esquema') && filename.includes('Créditos')) {
    return { ...base, temas: ['2'], type: 'teoria', tags: ['esquemas', 'créditos presupuestarios'] } as FileMapping;
  }
  if (filename.includes('Esquemas Tema 2')) {
    return { ...base, temas: ['2'], type: 'teoria', tags: ['esquemas', 'derecho presupuestario'] } as FileMapping;
  }

  return { ...base, temas: [], type: 'teoria', tags: ['sin clasificar'] } as FileMapping;
}

// ============================================================================
// Text chunking
// ============================================================================
function chunkText(text: string, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP): string[] {
  if (!text || text.trim().length === 0) return [];
  
  // Split by paragraphs first
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 20);
  
  const chunks: string[] = [];
  let current = '';
  
  for (const para of paragraphs) {
    if ((current + '\n\n' + para).length > chunkSize * 4) { // ~4 chars per token
      if (current.trim()) chunks.push(current.trim());
      current = para;
    } else {
      current = current ? current + '\n\n' + para : para;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  
  // If we got no chunks from paragraph splitting, do simple char splitting
  if (chunks.length === 0 && text.trim().length > 0) {
    const maxChars = chunkSize * 4;
    for (let i = 0; i < text.length; i += maxChars - overlap * 4) {
      const chunk = text.slice(i, i + maxChars).trim();
      if (chunk.length > 50) chunks.push(chunk);
    }
  }
  
  return chunks;
}

// ============================================================================
// Random embedding (placeholder for real embeddings later)
// ============================================================================
function randomEmbedding(): number[] {
  const dim = 1536;
  const vec = Array.from({ length: dim }, () => (Math.random() * 2 - 1));
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
  return vec.map(v => v / norm);
}

function pgVector(vec: number[]): string {
  return `[${vec.join(',')}]`;
}

// ============================================================================
// Main pipeline
// ============================================================================
async function main() {
  console.log('🚀 Oposita+ Content Processing Pipeline');
  console.log('========================================\n');

  const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('✅ Connected to Supabase\n');

  // Step 1: Ensure organization + opposition exist
  console.log('📋 Setting up reference data...');
  
  let orgId: string;
  const orgResult = await client.query(`SELECT id FROM organizations WHERE slug = 'cip-formacion' LIMIT 1`);
  if (orgResult.rows.length > 0) {
    orgId = orgResult.rows[0].id;
    console.log(`  → Organization exists: ${orgId}`);
  } else {
    const ins = await client.query(`
      INSERT INTO organizations (name, slug, description, email, status, commission_rate)
      VALUES ('CIP Formación', 'cip-formacion', 'Centro de formación en Vigo, fundado 1989', 'info@cip-formacion.com', 'active', 20.00)
      RETURNING id
    `);
    orgId = ins.rows[0].id;
    console.log(`  → Created organization: ${orgId}`);
  }

  let opoId: string;
  const opoResult = await client.query(`SELECT id FROM oppositions WHERE slug = 'tecnico-hacienda-dt' LIMIT 1`);
  if (opoResult.rows.length > 0) {
    opoId = opoResult.rows[0].id;
    console.log(`  → Opposition exists: ${opoId}`);
  } else {
    // Check if opposition_categories exists and has a row
    let catId: string | null = null;
    try {
      const catRes = await client.query(`SELECT id FROM opposition_categories LIMIT 1`);
      if (catRes.rows.length > 0) catId = catRes.rows[0].id;
      else {
        const newCat = await client.query(`
          INSERT INTO opposition_categories (name, slug) VALUES ('Hacienda', 'hacienda') RETURNING id
        `);
        catId = newCat.rows[0].id;
      }
    } catch { /* table may not exist */ }

    const ins = await client.query(`
      INSERT INTO oppositions (name, slug, description, official_body, exam_type, status, category_id, metadata)
      VALUES (
        'Técnico de Hacienda del Estado', 'tecnico-hacienda-dt',
        '3er ejercicio: Derecho Financiero y Tributario Español - 36 temas',
        'Agencia Tributaria', 'oposicion', 'active',
        ${catId ? `'${catId}'` : 'NULL'},
        '{"temas": 36, "ejercicio": 3}'::jsonb
      )
      RETURNING id
    `);
    opoId = ins.rows[0].id;
    console.log(`  → Created opposition: ${opoId}`);
  }

  // Ensure org-opposition link
  try {
    await client.query(`
      INSERT INTO organization_oppositions (organization_id, opposition_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `, [orgId, opoId]);
  } catch { /* may not have unique constraint */ }

  // Get already processed files
  const existingFiles = new Set<string>();
  const existRes = await client.query('SELECT DISTINCT file_name FROM content_uploads');
  existRes.rows.forEach((r: any) => existingFiles.add(r.file_name));
  console.log(`  → ${existingFiles.size} files already processed, skipping them\n`);

  // Step 2: Collect all files
  console.log('\n📂 Collecting files...');
  const files: { path: string; name: string; source: string }[] = [];
  
  for (const f of fs.readdirSync(PDF_DIR)) {
    if (f.endsWith('.ico')) continue;
    files.push({ path: path.join(PDF_DIR, f), name: f, source: 'pdfs' });
  }
  
  for (const f of fs.readdirSync(FOLDERS_DIR)) {
    if (f.endsWith('.ico')) continue;
    files.push({ path: path.join(FOLDERS_DIR, f), name: f, source: 'folders' });
  }
  
  console.log(`  → Found ${files.length} files\n`);

  // Step 3: Process each file
  let totalChunks = 0;
  let totalQuestions = 0;
  let totalFlashcards = 0;
  let processed = 0;
  let failed = 0;
  const temasCovered = new Set<string>();

  for (const file of files) {
    const isPdf = file.name.toLowerCase().endsWith('.pdf');
    const isPptx = file.name.toLowerCase().endsWith('.pptx');
    
    if (existingFiles.has(file.name)) {
      console.log(`  ⏭️  Skipping ${file.name} (already processed)`);
      continue;
    }

    if (!isPdf && !isPptx) {
      console.log(`  ⏭️  Skipping ${file.name} (unsupported format)`);
      continue;
    }

    console.log(`  📄 Processing: ${file.name}`);
    
    try {
      let text = '';
      
      if (isPdf) {
        const buffer = fs.readFileSync(file.path);
        const data = await pdfParse(buffer);
        text = data.text || '';
      } else if (isPptx) {
        // Simple PPTX text extraction (XML-based)
        // For now, skip PPTX — needs separate library
        console.log(`     ⚠️  PPTX skipped (needs mammoth/pptx library)`);
        continue;
      }

      if (!text || text.trim().length < 50) {
        console.log(`     ⚠️  No extractable text (scanned PDF?)`);
        failed++;
        continue;
      }

      const mapping = mapFilename(file.name);
      mapping.temas.forEach(t => temasCovered.add(t));

      // Insert content_upload
      const uploadRes = await client.query(`
        INSERT INTO content_uploads (center_id, oposicion_id, file_name, file_type, mime_type, storage_path, status, progress, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, 'completed', 100, $7)
        RETURNING id
      `, [
        orgId, opoId, file.name,
        isPdf ? 'pdf' : 'pptx',
        isPdf ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        `${orgId}/${opoId}/${file.name}`,
        JSON.stringify({ source: file.source, temas: mapping.temas, type: mapping.type, academicYear: mapping.academicYear })
      ]);
      const uploadId = uploadRes.rows[0].id;

      // Insert processed_content
      const procRes = await client.query(`
        INSERT INTO processed_content (upload_id, content_type, raw_text, chunks, metadata)
        VALUES ($1, 'text', $2, $3, $4)
        RETURNING id
      `, [
        uploadId, text,
        JSON.stringify(chunkText(text).map((c, i) => ({ index: i, length: c.length }))),
        JSON.stringify({ charCount: text.length, extractedAt: new Date().toISOString() })
      ]);
      const contentId = procRes.rows[0].id;

      // Insert knowledge_chunks
      const chunks = chunkText(text);
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const primaryTema = mapping.temas.length > 0 ? `Tema ${mapping.temas[0]}` : null;
        
        const chunkRes = await client.query(`
          INSERT INTO knowledge_chunks (content_id, oposicion_id, tema, chunk_text, tags, source_ref)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id
        `, [
          contentId, opoId, primaryTema, chunk,
          mapping.tags,
          `${file.name}#chunk${i + 1}`
        ]);
        
        totalChunks++;

        // For practice/exam content, generate basic questions from the text
        if (mapping.type === 'practica' || mapping.type === 'examen') {
          // Extract question-like patterns from the text
          const questions = extractQuestionsFromText(chunk, mapping);
          for (const q of questions) {
            await client.query(`
              INSERT INTO generated_questions (chunk_id, oposicion_id, question_text, options, correct_answer, explanation, difficulty, validated, metadata)
              VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8)
            `, [
              chunkRes.rows[0].id, opoId,
              q.question, JSON.stringify(q.options), q.answer, q.explanation,
              q.difficulty,
              JSON.stringify({ source: file.name, type: mapping.type, autoExtracted: true })
            ]);
            totalQuestions++;
          }
        }

        // Generate flashcards for theory content (1 per chunk)
        if (mapping.type === 'teoria' && chunk.length > 200) {
          const flashcard = generateFlashcard(chunk, mapping, file.name);
          if (flashcard) {
            await client.query(`
              INSERT INTO flashcards (chunk_id, oposicion_id, front, back, tags, difficulty, metadata)
              VALUES ($1, $2, $3, $4, $5, 3, $6)
            `, [
              chunkRes.rows[0].id, opoId,
              flashcard.front, flashcard.back,
              mapping.tags,
              JSON.stringify({ source: file.name, autoGenerated: true })
            ]);
            totalFlashcards++;
          }
        }
      }

      console.log(`     ✅ ${chunks.length} chunks, ${text.length} chars`);
      processed++;
    } catch (err: any) {
      console.log(`     ❌ Error: ${err.message}`);
      failed++;
    }
  }

  // Summary
  console.log('\n========================================');
  console.log('📊 Import Summary');
  console.log('========================================');
  console.log(`Files processed: ${processed}`);
  console.log(`Files failed:    ${failed}`);
  console.log(`Total chunks:    ${totalChunks}`);
  console.log(`Questions:       ${totalQuestions}`);
  console.log(`Flashcards:      ${totalFlashcards}`);
  console.log(`Temas covered:   ${temasCovered.size}/36 (${[...temasCovered].sort((a, b) => +a - +b).join(', ')})`);
  console.log('========================================\n');

  await client.end();
  console.log('✅ Done!');
}

// ============================================================================
// Question extraction (basic pattern matching for practice/exam PDFs)
// ============================================================================
function extractQuestionsFromText(text: string, mapping: FileMapping): Array<{
  question: string; options: string[]; answer: string; explanation: string; difficulty: number;
}> {
  const questions: Array<{ question: string; options: string[]; answer: string; explanation: string; difficulty: number }> = [];
  
  // Pattern: numbered questions with a), b), c), d) options
  const qPattern = /(\d+[\.\)]\s*.+?)(?=\n\s*[a-d]\))/gs;
  const optPattern = /([a-d])\)\s*(.+?)(?=\n\s*[a-d]\)|$)/gs;
  
  // Simple extraction: grab paragraphs that look like case studies / questions
  const paragraphs = text.split(/\n\s*\n/);
  for (const para of paragraphs) {
    if (para.length > 100 && para.length < 2000 && (
      para.includes('?') || 
      para.toLowerCase().includes('caso') ||
      para.toLowerCase().includes('supuesto') ||
      para.toLowerCase().includes('determine') ||
      para.toLowerCase().includes('calcul')
    )) {
      questions.push({
        question: para.trim().slice(0, 500),
        options: [],
        answer: 'Ver solución en el material',
        explanation: `Extraído de ${mapping.tags.join(', ')}`,
        difficulty: mapping.type === 'examen' ? 4 : 3,
      });
    }
  }
  
  return questions.slice(0, 5); // Max 5 questions per chunk
}

// ============================================================================
// Flashcard generation (heuristic from text)
// ============================================================================
function generateFlashcard(text: string, mapping: FileMapping, filename: string): { front: string; back: string } | null {
  // Extract first meaningful sentence as question, rest as answer
  const sentences = text.split(/[.!?]\s+/).filter(s => s.trim().length > 30);
  if (sentences.length < 2) return null;
  
  const front = `¿Qué establece ${mapping.temas.length > 0 ? `el Tema ${mapping.temas[0]}` : filename.replace('.pdf', '')} sobre: "${sentences[0].trim().slice(0, 150)}..."?`;
  const back = sentences.slice(1, 4).join('. ').trim().slice(0, 500);
  
  if (back.length < 50) return null;
  return { front, back };
}

main().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
