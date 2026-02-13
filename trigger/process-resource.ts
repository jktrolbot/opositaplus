import { task } from '@trigger.dev/sdk/v3';

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
    const pdfParse = (pdfParseModule as any).default ?? pdfParseModule;
    const pdf = await pdfParse(buffer);
    const text = pdf.text;

    // 3. Chunk text
    const chunks = chunkText(text, 1000, 200);

    // 4. Generate embeddings and store
    // TODO: Integrate with OpenAI embeddings + Supabase pgvector
    // For now, store chunks as document_chunks

    return {
      status: 'completed',
      resourceId,
      chunks: chunks.length,
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
