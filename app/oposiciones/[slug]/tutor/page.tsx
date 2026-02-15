'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, Send } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { oposiciones } from '@/data/oposiciones';
import { OposicionNotFound } from '@/components/oposiciones/not-found';
import { OposicionPageHeader } from '@/components/oposiciones/page-header';
import { AuthGuard } from '@/components/auth-guard';
import { useAuth } from '@/lib/auth-context';
import { analytics } from '@/lib/analytics';
import { storage } from '@/lib/storage';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function OposicionTutorPage() {
  const params = useParams<{ slug: string }>();
  const slug = typeof params?.slug === 'string' ? params.slug : '';
  const oposicion = useMemo(() => oposiciones.find((item) => item.slug === slug), [slug]);
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Soy tu preparador personal. Puedes preguntarme normativa, articulos concretos, estrategia de estudio o dudas de test.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  if (!oposicion) {
    return (
      <AuthGuard>
        <OposicionNotFound />
      </AuthGuard>
    );
  }

  const suggestedQuestions = [
    `Resumen de ${oposicion.topics[0]?.name ?? 'Constitución Española'} con artículos clave`,
    `Errores típicos en test de ${oposicion.shortName}`,
    `Cómo organizar 8 semanas para ${oposicion.shortName}`,
    `Repaso rápido de ${oposicion.topics[1]?.name ?? 'procedimiento administrativo'}`,
  ];

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    
    // Track tutor interaction
    if (user?.id && oposicion) {
      const interactionType = input.toLowerCase().includes('?') ? 'question' : 'explanation';
      analytics.tutorInteraction({
        userId: user.id,
        interactionType,
        topic: oposicion.shortName,
      });
      
      // Track first tutor use milestone
      const previousMessages = messages.filter(m => m.role === 'user').length;
      if (previousMessages === 0) {
        analytics.activationMilestone({
          userId: user.id,
          milestone: 'first_tutor_use',
        });
      }
    }

    try {
      const response = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oposicion: oposicion.slug,
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('No response stream');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      let pendingBuffer = '';

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      const appendAssistantChunk = (line: string) => {
        if (!line.startsWith('data:')) return;
        const data = line.replace(/^data:\s*/, '');
        if (!data || data === '[DONE]') return;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content ?? '';
          if (!content) return;

          assistantMessage += content;
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: 'assistant', content: assistantMessage };
            return updated;
          });
        } catch {
          // ignore malformed chunks
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        pendingBuffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });

        let newlineIndex = pendingBuffer.indexOf('\n');
        while (newlineIndex !== -1) {
          const line = pendingBuffer.slice(0, newlineIndex).trim();
          pendingBuffer = pendingBuffer.slice(newlineIndex + 1);
          appendAssistantChunk(line);
          newlineIndex = pendingBuffer.indexOf('\n');
        }

        if (done) break;
      }

      const remainingLine = pendingBuffer.trim();
      if (remainingLine) {
        appendAssistantChunk(remainingLine);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'No he podido responder ahora mismo. Reintenta en unos segundos.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <main className="min-h-screen bg-slate-50">
        <OposicionPageHeader oposicion={oposicion} current="Preparador personal" />

      <section className="mx-auto flex h-[calc(100vh-165px)] max-w-5xl flex-col px-4 py-5">
        <div className="mb-3 flex flex-wrap gap-2">
          {oposicion.topics.slice(0, 4).map((topic) => (
            <Badge key={topic.id} variant="outline">
              {topic.name}
            </Badge>
          ))}
        </div>

        <div className="mb-4 flex-1 space-y-3 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4">
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                  message.role === 'user' ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-slate-50 text-slate-800'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {loading && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
              </div>
            </div>
          )}
        </div>

        {messages.length === 1 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {suggestedQuestions.map((question) => (
              <Badge
                key={question}
                variant="outline"
                className="cursor-pointer hover:border-slate-900 hover:bg-slate-900 hover:text-white"
                onClick={() => setInput(question)}
              >
                {question}
              </Badge>
            ))}
          </div>
        )}

        <Card className="p-3">
          <div className="flex gap-2">
            <Textarea
              placeholder={`Pregunta sobre ${oposicion.name}...`}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={loading}
              className="min-h-[68px] resize-none"
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="h-[68px] bg-slate-900 px-5 text-white hover:bg-slate-700"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <p className="mt-2 text-xs text-slate-500">Enter para enviar · Shift + Enter para salto de linea.</p>
        </Card>
      </section>
      </main>
    </AuthGuard>
  );
}
