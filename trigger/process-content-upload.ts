import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { task, tasks } from '@trigger.dev/sdk/v3';
import { chunkText } from '../lib/knowledge/chunking';
import { detectContentRoute } from '../lib/knowledge/mime';
import {
  extractTextWithGeminiVision,
  summarizeFramesWithGemini,
  transcribeWithAssemblyAI,
} from '../lib/knowledge/ai';
import { createServiceSupabase, getUploadFileBytes, updateUploadState } from './knowledge-pipeline-utils';
import type { generateStudyMaterial } from './generate-study-material';

function runCommand(command: string, args: string[], cwd?: string) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { cwd });
    let stderr = '';

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      reject(new Error(`${command} error: ${error.message}`));
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} exited with code ${code}: ${stderr}`));
      }
    });
  });
}

async function processVideo(bytes: Buffer, fileName: string) {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'opositaplus-video-'));
  const inputPath = path.join(tempRoot, fileName.replace(/[^a-zA-Z0-9_.-]/g, '_') || 'input.mp4');
  const audioPath = path.join(tempRoot, 'audio.mp3');
  const framesDir = path.join(tempRoot, 'frames');

  try {
    await mkdir(framesDir, { recursive: true });
    await writeFile(inputPath, bytes);

    await runCommand('ffmpeg', ['-y', '-i', inputPath, '-vn', '-ac', '1', '-ar', '16000', audioPath]);
    await runCommand('ffmpeg', ['-y', '-i', inputPath, '-vf', 'fps=1/30', '-frames:v', '3', path.join(framesDir, 'frame-%02d.jpg')]);

    const [audioBytes, frameFiles] = await Promise.all([
      readFile(audioPath),
      readdir(framesDir),
    ]);

    const frames = await Promise.all(
      frameFiles
        .filter((fileName) => fileName.toLowerCase().endsWith('.jpg'))
        .slice(0, 3)
        .map(async (frameFile) => ({
          mimeType: 'image/jpeg',
          bytes: await readFile(path.join(framesDir, frameFile)),
        })),
    );

    const transcript = await transcribeWithAssemblyAI({
      bytes: audioBytes,
      mimeType: 'audio/mpeg',
    });

    const visual = await summarizeFramesWithGemini({ frames, fileName });

    const rawText = [
      transcript.text,
      visual.visualSummary ? `Contexto visual:\n${visual.visualSummary}` : '',
    ]
      .filter(Boolean)
      .join('\n\n')
      .trim();

    return {
      rawText,
      tags: visual.tags,
      metadata: {
        transcript_confidence: transcript.confidence,
        transcript_id: transcript.transcriptId,
        frame_count: frames.length,
      },
    };
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
}

export const processContentUpload = task({
  id: 'processContentUpload',
  maxDuration: 1800,
  run: async (payload: { uploadId: string; force?: boolean }) => {
    const supabase = createServiceSupabase();
    const uploadId = payload.uploadId;

    const failUpload = async (message: string) => {
      await updateUploadState({
        supabase,
        uploadId,
        status: 'failed',
        progress: 100,
        errorMessage: message.slice(0, 1000),
        metadataPatch: { failed_at: new Date().toISOString() },
      });
    };

    try {
      const { data: upload, error: uploadError } = await supabase
        .from('content_uploads')
        .select('*')
        .eq('id', uploadId)
        .single();

      if (uploadError || !upload) {
        throw new Error(uploadError?.message ?? 'Upload no encontrado');
      }

      await updateUploadState({
        supabase,
        uploadId,
        status: 'processing',
        progress: 5,
        errorMessage: null,
        metadataPatch: {
          started_at: new Date().toISOString(),
          route: detectContentRoute(upload.file_name, upload.mime_type),
        },
      });

      if (payload.force) {
        const { error } = await supabase
          .from('processed_content')
          .delete()
          .eq('upload_id', uploadId);

        if (error) {
          throw new Error(`No se pudo limpiar contenido previo: ${error.message}`);
        }
      }

      const { signedUrl, bytes } = await getUploadFileBytes({
        supabase,
        storagePath: upload.storage_path,
      });

      const route = detectContentRoute(upload.file_name, upload.mime_type);
      let rawText = '';
      let contentType: 'text' | 'transcript' | 'ocr' = 'ocr';
      let detectedQuestions: Array<{
        question_text: string;
        options: Array<{ key: string; text: string }>;
        correct_answer: string;
        explanation: string | null;
        difficulty: number;
        tags: string[];
      }> = [];
      let tema: string | null = null;
      let subtema: string | null = null;
      let tags: string[] = [];
      const metadata: Record<string, unknown> = {
        route,
      };

      await updateUploadState({ supabase, uploadId, progress: 20 });

      if (route === 'text') {
        contentType = 'text';
        rawText = new TextDecoder('utf-8').decode(bytes).trim();
      } else if (route === 'audio') {
        contentType = 'transcript';
        const transcript = await transcribeWithAssemblyAI({ fileUrl: signedUrl });
        rawText = transcript.text;
        metadata.transcript_id = transcript.transcriptId;
        metadata.transcript_confidence = transcript.confidence;
      } else if (route === 'video') {
        contentType = 'transcript';
        const videoResult = await processVideo(bytes, upload.file_name);
        rawText = videoResult.rawText;
        tags = [...videoResult.tags];
        Object.assign(metadata, videoResult.metadata);
      } else {
        contentType = 'ocr';
        const extracted = await extractTextWithGeminiVision({
          bytes,
          mimeType: upload.mime_type,
          fileName: upload.file_name,
          extractQuestions: route === 'test',
        });

        rawText = extracted.rawText;
        tema = extracted.tema;
        subtema = extracted.subtema;
        tags = extracted.tags;
        detectedQuestions = extracted.detectedQuestions;
        metadata.gemini_model = extracted.model;
      }

      if (!rawText || rawText.trim().length < 30) {
        throw new Error('No se pudo extraer contenido textual suficiente');
      }

      await updateUploadState({ supabase, uploadId, progress: 45 });

      const chunks = chunkText(rawText, 1200, 180).map((chunk, index) => ({
        chunk_index: index,
        text: chunk,
      }));

      const { data: processed, error: processedError } = await supabase
        .from('processed_content')
        .insert({
          upload_id: uploadId,
          content_type: contentType,
          raw_text: rawText,
          chunks,
          metadata: {
            ...metadata,
            tema,
            subtema,
            tags,
            extracted_questions_count: detectedQuestions.length,
          },
        })
        .select('id')
        .single();

      if (processedError || !processed) {
        throw new Error(processedError?.message ?? 'No se pudo guardar processed_content');
      }

      await updateUploadState({ supabase, uploadId, progress: 60 });

      await tasks.trigger<typeof generateStudyMaterial>('generateStudyMaterial', {
        uploadId,
        processedContentId: processed.id,
        detectedQuestions,
      });

      await updateUploadState({
        supabase,
        uploadId,
        progress: 70,
        metadataPatch: {
          queued_generate_material: true,
          processed_content_id: processed.id,
        },
      });

      return {
        status: 'queued',
        uploadId,
        processedContentId: processed.id,
        route,
        chunks: chunks.length,
      };
    } catch (error) {
      const message = (error as Error).message;
      console.error('process-content-upload error', { uploadId, message });
      await failUpload(message);
      throw error;
    }
  },
});
