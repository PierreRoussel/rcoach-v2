DELETE FROM storage.buckets WHERE id = 'exercise-demos';

ALTER TABLE public.exercises
  DROP COLUMN IF EXISTS description_fr,
  DROP COLUMN IF EXISTS description_en,
  DROP COLUMN IF EXISTS coaching_cues,
  DROP COLUMN IF EXISTS demo_file_id,
  DROP COLUMN IF EXISTS demo_poster_file_id,
  DROP COLUMN IF EXISTS content_status,
  DROP COLUMN IF EXISTS content_source;
