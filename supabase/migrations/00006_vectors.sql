-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Document chunks for RAG
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_chunks_resource ON document_chunks(resource_id);
CREATE INDEX idx_chunks_org ON document_chunks(organization_id);

-- HNSW index for fast similarity search
CREATE INDEX idx_chunks_embedding ON document_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Function to match documents by similarity
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5,
  filter_org_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.content,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  WHERE
    (filter_org_id IS NULL OR dc.organization_id = filter_org_id)
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- RLS
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chunks_select" ON document_chunks FOR SELECT USING (
  organization_id IN (SELECT get_user_org_ids()) OR is_super_admin()
);
CREATE POLICY "chunks_insert" ON document_chunks FOR INSERT WITH CHECK (
  organization_id IN (SELECT get_user_org_ids()) OR is_super_admin()
);
CREATE POLICY "chunks_delete" ON document_chunks FOR DELETE USING (
  organization_id IN (SELECT get_user_org_ids()) OR is_super_admin()
);
