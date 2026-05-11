
INSERT INTO storage.buckets (id, name, public)
VALUES ('campaign-media', 'campaign-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "campaign_media_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'campaign-media');

CREATE POLICY "campaign_media_user_insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'campaign-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "campaign_media_user_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'campaign-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "campaign_media_user_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'campaign-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
