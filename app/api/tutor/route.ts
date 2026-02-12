import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OPENAI_API_KEY no configurada' }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey });
    const { messages } = await request.json();

    const systemPrompt = `Eres un experto preparador de oposiciones en España, especializado en ayudar a opositores a preparar exámenes públicos.

Tu función es:
- Explicar legislación española de forma clara y precisa
- Responder dudas sobre temas de oposiciones
- Proporcionar resúmenes y esquemas de leyes
- Ayudar con estrategias de estudio y memorización
- Citar artículos específicos cuando sea relevante

Temas principales que dominas:
- Constitución Española de 1978
- Estatuto de Autonomía de Galicia
- Ley 39/2015 (Procedimiento Administrativo Común)
- Ley 40/2015 (Régimen Jurídico del Sector Público)
- Derecho Administrativo general
- Función Pública y EBEP (Ley 7/2007)
- Hacienda Pública
- Derecho de la Unión Europea

Estilo de comunicación:
- Usa "tú"
- Sé profesional pero cercano
- Estructura la información de forma clara
- Si algo no está en tu conocimiento, admítelo honestamente

IMPORTANTE: No menciones que eres un sistema de IA.`;

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 1000,
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
