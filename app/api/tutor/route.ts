import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';
import { getOposicionBySlug } from '@/data/oposiciones';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OPENAI_API_KEY no configurada' }, { status: 500 });
    }

    const { messages, oposicion } = await request.json();

    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: 'Formato de mensajes invalido' }, { status: 400 });
    }

    const oposicionData =
      typeof oposicion === 'string' && oposicion.length > 0
        ? getOposicionBySlug(oposicion)
        : null;

    const oposicionName = oposicionData?.name ?? 'oposiciones en Espana';
    const topicsList =
      oposicionData?.topics.map((topic) => topic.name).join(', ') ??
      'Constitucion Espanola, Ley 39/2015, Ley 40/2015, Derecho Administrativo';

    const systemPrompt = `You are an expert tutor for ${oposicionName}.
Your knowledge covers: ${topicsList}.
Always reference specific Spanish law articles when relevant.

Guidelines:
- Explain legal concepts with exam-level precision.
- Use practical exam-focused language in Spanish.
- Mention article numbers explicitly (for example: Art. 103 CE, Art. 21 Ley 39/2015).
- If there are legal nuances, explain exceptions and limits.
- Do not mention being an AI system.`;

    const openai = new OpenAI({ apiKey });

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      stream: true,
      temperature: 0.4,
      max_tokens: 900,
    });

    const encoder = new TextEncoder();
    const customStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = `data: ${JSON.stringify(chunk)}\n\n`;
          controller.enqueue(encoder.encode(text));
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    return new Response(customStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Tutor API error:', error);
    return NextResponse.json({ error: 'Error al procesar la consulta' }, { status: 500 });
  }
}
