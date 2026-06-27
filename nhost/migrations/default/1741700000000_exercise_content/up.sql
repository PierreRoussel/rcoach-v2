ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS description_fr TEXT,
  ADD COLUMN IF NOT EXISTS description_en TEXT,
  ADD COLUMN IF NOT EXISTS coaching_cues JSONB,
  ADD COLUMN IF NOT EXISTS demo_file_id UUID,
  ADD COLUMN IF NOT EXISTS demo_poster_file_id UUID,
  ADD COLUMN IF NOT EXISTS content_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (content_status IN ('pending', 'ready', 'partial', 'failed')),
  ADD COLUMN IF NOT EXISTS content_source TEXT
    CHECK (content_source IS NULL OR content_source IN ('seed', 'wger', 'manual', 'catalog'));

UPDATE public.exercises
SET content_status = 'pending'
WHERE content_status IS NULL;

INSERT INTO storage.buckets (id, max_upload_file_size, cache_control)
VALUES ('exercise-demos', 15728640, 'public, max-age=604800')
ON CONFLICT (id) DO UPDATE
SET
  max_upload_file_size = EXCLUDED.max_upload_file_size,
  cache_control = EXCLUDED.cache_control;
