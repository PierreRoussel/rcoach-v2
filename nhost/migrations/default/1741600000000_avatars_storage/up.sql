INSERT INTO storage.buckets (id, max_upload_file_size, cache_control)
VALUES ('avatars', 5242880, 'public, max-age=86400')
ON CONFLICT (id) DO UPDATE
SET
  max_upload_file_size = EXCLUDED.max_upload_file_size,
  cache_control = EXCLUDED.cache_control;
