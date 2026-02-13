-- Storage bucket for resources (PDFs, documents, etc.)
INSERT INTO storage.buckets (id, name, public) VALUES ('resources', 'resources', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their org's folder
CREATE POLICY "resources_upload" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'resources');

-- Allow authenticated users to read resources
CREATE POLICY "resources_read" ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'resources');

-- Allow authenticated users to delete their own uploads
CREATE POLICY "resources_delete" ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'resources');
