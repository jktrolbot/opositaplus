function normalizeWhitespace(input: string) {
  return input.replace(/\r/g, '\n').replace(/\n{3,}/g, '\n\n').replace(/\t/g, ' ').trim();
}

export function chunkText(rawText: string, chunkSize = 1200, overlap = 180): string[] {
  const text = normalizeWhitespace(rawText);
  if (!text) return [];

  const chunks: string[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const tentativeEnd = Math.min(cursor + chunkSize, text.length);
    let end = tentativeEnd;

    if (tentativeEnd < text.length) {
      const nextParagraph = text.lastIndexOf('\n\n', tentativeEnd);
      const nextSentence = text.lastIndexOf('. ', tentativeEnd);
      const splitAt = Math.max(nextParagraph, nextSentence);

      if (splitAt > cursor + Math.floor(chunkSize * 0.4)) {
        end = splitAt + 1;
      }
    }

    const chunk = text.slice(cursor, end).trim();
    if (chunk) {
      chunks.push(chunk);
    }

    if (end >= text.length) break;
    cursor = Math.max(0, end - overlap);
  }

  return chunks;
}

export function summarizeChunkForPrompt(text: string, maxLength = 420) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}
