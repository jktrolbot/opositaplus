const DOCUMENT_EXTENSIONS = new Set(['pdf', 'docx', 'pptx']);
const VIDEO_EXTENSIONS = new Set(['mp4', 'mov', 'avi']);
const AUDIO_EXTENSIONS = new Set(['mp3', 'wav', 'm4a']);
const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png']);
const TEST_EXTENSIONS = new Set(['xlsx', 'csv']);

const DOCUMENT_MIME_PREFIXES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/msword',
  'application/vnd.ms-powerpoint',
];

const TEST_MIME_PREFIXES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/csv',
];

const IMAGE_MIME_PREFIXES = ['image/jpeg', 'image/png'];
const VIDEO_MIME_PREFIXES = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
const AUDIO_MIME_PREFIXES = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/x-m4a'];

export const ACCEPTED_UPLOAD_EXTENSIONS = [
  '.pdf',
  '.docx',
  '.pptx',
  '.mp4',
  '.mov',
  '.avi',
  '.mp3',
  '.wav',
  '.m4a',
  '.jpg',
  '.png',
  '.xlsx',
  '.csv',
  '.txt',
];

export type ContentRoute = 'document' | 'video' | 'audio' | 'test' | 'text';

export function getFileExtension(fileName: string) {
  const clean = fileName.toLowerCase().split('?')[0] ?? fileName.toLowerCase();
  const parts = clean.split('.');
  return parts.length > 1 ? parts.at(-1) ?? '' : '';
}

export function detectFileType(fileName: string, mimeType: string): string {
  const route = detectContentRoute(fileName, mimeType);
  switch (route) {
    case 'video':
      return 'video';
    case 'audio':
      return 'audio';
    case 'test':
      return 'test';
    case 'text':
      return 'text';
    default:
      return 'document';
  }
}

function matchMime(mimeType: string, accepted: string[]) {
  const normalized = mimeType.toLowerCase();
  return accepted.some((mime) => normalized.startsWith(mime));
}

export function detectContentRoute(fileName: string, mimeType: string): ContentRoute {
  const extension = getFileExtension(fileName);
  const normalizedMime = mimeType.toLowerCase();
  const lowerName = fileName.toLowerCase();
  const likelyTestFile = /(test|pregunta|simulacro|examen|quiz|cuestionario)/i.test(lowerName);

  if (extension === 'txt' || normalizedMime === 'text/plain') {
    return 'text';
  }

  if (
    likelyTestFile &&
    (extension === 'pdf' ||
      extension === 'docx' ||
      TEST_EXTENSIONS.has(extension) ||
      normalizedMime === 'application/pdf' ||
      matchMime(normalizedMime, DOCUMENT_MIME_PREFIXES) ||
      matchMime(normalizedMime, TEST_MIME_PREFIXES))
  ) {
    return 'test';
  }

  if (TEST_EXTENSIONS.has(extension) || matchMime(normalizedMime, TEST_MIME_PREFIXES)) {
    return 'test';
  }

  if (VIDEO_EXTENSIONS.has(extension) || matchMime(normalizedMime, VIDEO_MIME_PREFIXES)) {
    return 'video';
  }

  if (AUDIO_EXTENSIONS.has(extension) || matchMime(normalizedMime, AUDIO_MIME_PREFIXES)) {
    return 'audio';
  }

  if (
    DOCUMENT_EXTENSIONS.has(extension) ||
    IMAGE_EXTENSIONS.has(extension) ||
    matchMime(normalizedMime, DOCUMENT_MIME_PREFIXES) ||
    matchMime(normalizedMime, IMAGE_MIME_PREFIXES)
  ) {
    return 'document';
  }

  return 'document';
}

export function isAcceptedUpload(fileName: string, mimeType: string) {
  const extension = getFileExtension(fileName);
  if (ACCEPTED_UPLOAD_EXTENSIONS.includes(`.${extension}`)) {
    return true;
  }

  const normalizedMime = mimeType.toLowerCase();
  return (
    normalizedMime === 'text/plain' ||
    matchMime(normalizedMime, DOCUMENT_MIME_PREFIXES) ||
    matchMime(normalizedMime, TEST_MIME_PREFIXES) ||
    matchMime(normalizedMime, VIDEO_MIME_PREFIXES) ||
    matchMime(normalizedMime, AUDIO_MIME_PREFIXES) ||
    matchMime(normalizedMime, IMAGE_MIME_PREFIXES)
  );
}
