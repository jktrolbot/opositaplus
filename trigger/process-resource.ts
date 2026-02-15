import { task } from '@trigger.dev/sdk/v3';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export const processResource = task({
  id: 'process-resource',
  maxDuration: 300,
  run: async (payload: {
    resourceId: string;
    organizationId: string;
    url: string;
    type: string;
  }) => {
    const { resourceId, organizationId, url, type } = payload;

    if (type !== 'pdf') {
      return { status: 'skipped', reason: 'Only PDF processing supported' };
    }

    // 1. Fetch PDF
    const response = await fetch(url);
    const buffer = Buffer.from(await response.arrayBuffer());

    // 2. Extract text
    const pdfParseModule = await import('pdf-parse');
    const maybeDefault = (pdfParseModule as { default?: unknown }).default;
    const pdfParseCandidate = maybeDefault ?? pdfParseModule;
    if (typeof pdfParseCandidate !== 'function') {
      throw new Error('Invalid pdf parser module');
    }
    const pdf = await (pdfParseCandidate as (input: Buffer) => Promise<{ text: string }>)(buffer);
    const text: string = pdf.text;

    // 3. Chunk text
    const chunks = chunkText(text, 1000, 200);

    // 4. Generate embeddings and store in document_chunks
    const batchSize = 20;
    let stored = 0;

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);

      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: batch,
      });

      const rows = batch.map((content, idx) => ({
        resource_id: resourceId,
        organization_id: organizationId,
        content,
        embedding: JSON.stringify(embeddingResponse.data[idx].embedding),
        metadata: { chunk_index: i + idx, total_chunks: chunks.length },
      }));

      const { error } = await supabase.from('document_chunks').insert(rows);
      if (error) {
        console.error('Error inserting chunks:', error);
        throw new Error(`Failed to insert chunks: ${error.message}`);
      }
      stored += rows.length;
    }

    return {
      status: 'completed',
      resourceId,
      chunks: chunks.length,
      stored,
      textLength: text.length,
    };
  },
});

function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start += chunkSize - overlap;
  }
  return chunks;
}
