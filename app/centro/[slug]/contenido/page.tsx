'use client';

import { useEffect, useState } from 'react';
import { BookOpen, FileText, Loader2, Plus, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOrganization } from '@/lib/hooks/use-organization';
import { normalizeRole } from '@/lib/auth/roles';
import { getTopics, getResources } from '@/lib/actions/content';

interface TopicRow {
  id: string;
  title: string;
  description: string | null;
  opposition_id: string;
  sort_order: number;
}

interface ResourceRow {
  id: string;
  title: string;
  type: string;
  topic_id: string | null;
  url: string | null;
  file_size: number | null;
}

export default function ContenidoPage() {
  const { organization, userRole, isLoading: orgLoading } = useOrganization();
  const normalizedRole = normalizeRole(userRole);
  const [topics, setTopics] = useState<TopicRow[]>([]);
  const [resources, setResources] = useState<ResourceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organization) return;
    Promise.all([
      getTopics(organization.id),
      getResources(organization.id),
    ])
      .then(([t, r]) => {
        setTopics((t ?? []) as unknown as TopicRow[]);
        setResources((r ?? []) as unknown as ResourceRow[]);
      })
      .finally(() => setLoading(false));
  }, [organization]);

  if (orgLoading || loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#1B3A5C]" />
      </div>
    );
  }

  const canEdit =
    normalizedRole === 'centro_admin' || normalizedRole === 'super_admin' || normalizedRole === 'profesor';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B3A5C]">Contenido</h1>
          <p className="text-sm text-slate-500">{topics.length} temas · {resources.length} recursos</p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo tema
            </Button>
            <Button className="bg-[#1B3A5C] text-white hover:bg-[#16314d]">
              <Upload className="mr-2 h-4 w-4" />
              Subir recurso
            </Button>
          </div>
        )}
      </div>

      {topics.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="py-10 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-2 text-sm text-slate-500">No hay temas creados aún.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {topics.map((topic) => {
            const topicResources = resources.filter((r) => r.topic_id === topic.id);
            return (
              <Card key={topic.id} className="border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BookOpen className="h-4 w-4 text-[#1B3A5C]" />
                    {topic.title}
                  </CardTitle>
                  {topic.description && (
                    <p className="text-sm text-slate-500">{topic.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  {topicResources.length === 0 ? (
                    <p className="text-sm text-slate-400">Sin recursos</p>
                  ) : (
                    <div className="space-y-1">
                      {topicResources.map((r) => (
                        <div key={r.id} className="flex items-center gap-2 text-sm">
                          <FileText className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-slate-700">{r.title}</span>
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">{r.type}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
