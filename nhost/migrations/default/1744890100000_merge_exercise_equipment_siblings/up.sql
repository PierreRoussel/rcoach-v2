-- equipment_options on catalog + merge siblings + exercise_merge_map

CREATE OR REPLACE FUNCTION public.strip_exercise_equipment_suffix(raw text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT trim(
    regexp_replace(
      raw,
      '\s*\((barbell|barre|dumbbell|dumbbells|halt[eè]res|halteres|cable|poulie|machine|bodyweight|poids du corps|kettlebell|band|bands|[eé]lastique|elastique|other|autre)\)\s*$',
      '',
      'i'
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.exercise_family_key(name text, is_public boolean)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT lower(public.strip_exercise_equipment_suffix(name))
    || '|'
    || CASE WHEN is_public THEN 'pub' ELSE 'priv' END;
$$;

ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS equipment_options text[] NOT NULL DEFAULT '{}';

UPDATE public.exercises
SET equipment_options = ARRAY[COALESCE(NULLIF(trim(equipment), ''), 'other')]
WHERE equipment_options = '{}'::text[];

ALTER TABLE public.exercises
  ADD CONSTRAINT exercises_equipment_options_valid
  CHECK (
  equipment_options <@ ARRAY[
    'barbell','dumbbell','cable','machine','bodyweight','kettlebell','band','other'
  ]::text[]);

CREATE TABLE IF NOT EXISTS public.exercise_merge_map (
  old_id uuid PRIMARY KEY REFERENCES public.exercises(id) ON DELETE CASCADE,
  new_id uuid NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS exercise_merge_map_new_id_idx
  ON public.exercise_merge_map (new_id);

DO $$
DECLARE
  fam record;
  survivor_id uuid;
  loser_id uuid;
  opts text[];
BEGIN
  FOR fam IN
    SELECT
      public.exercise_family_key(e.name, e.is_public) AS fam_key,
      array_agg(e.id ORDER BY e.created_at) AS member_ids,
      count(*) AS cnt
    FROM public.exercises e
    GROUP BY 1
    HAVING count(*) > 1
  LOOP
    SELECT e.id INTO survivor_id
    FROM public.exercises e
    WHERE e.id = ANY (fam.member_ids)
    ORDER BY
      (CASE WHEN e.demo_file_id IS NOT NULL THEN 8 ELSE 0 END
        + CASE WHEN e.coaching_cues IS NOT NULL AND e.coaching_cues::text NOT IN ('null', '[]', '{}') THEN 4 ELSE 0 END
        + CASE WHEN e.description_fr IS NOT NULL AND length(trim(e.description_fr)) > 0 THEN 2 ELSE 0 END
        + CASE WHEN e.description_en IS NOT NULL AND length(trim(e.description_en)) > 0 THEN 1 ELSE 0 END) DESC,
      e.wger_exercise_id NULLS LAST,
      e.created_at ASC
    LIMIT 1;

  SELECT array_agg(DISTINCT opt ORDER BY opt)
  INTO opts
  FROM (
    SELECT COALESCE(NULLIF(trim(equipment), ''), 'other') AS opt
    FROM public.exercises
    WHERE id = ANY (fam.member_ids)
  ) s;

  UPDATE public.exercises
  SET
    equipment_options = COALESCE(opts, ARRAY['other']::text[]),
    equipment = COALESCE(
      NULLIF(trim(equipment), ''),
      (SELECT COALESCE(NULLIF(trim(e2.equipment), ''), 'other')
         FROM public.exercises e2 WHERE e2.id = survivor_id),
      'other'
    ),
    name = public.strip_exercise_equipment_suffix(name),
    name_fr = CASE
      WHEN name_fr IS NULL OR trim(name_fr) = '' THEN name_fr
      ELSE public.strip_exercise_equipment_suffix(name_fr)
    END
  WHERE id = survivor_id;

  FOR loser_id IN
    SELECT m FROM unnest(fam.member_ids) AS m WHERE m <> survivor_id
  LOOP
    INSERT INTO public.exercise_merge_map (old_id, new_id)
    VALUES (loser_id, survivor_id)
    ON CONFLICT (old_id) DO UPDATE SET new_id = EXCLUDED.new_id;

    UPDATE public.workout_template_exercises
    SET
      exercise_id = survivor_id,
      equipment = COALESCE(
        NULLIF(trim(equipment), ''),
        (SELECT COALESCE(NULLIF(trim(e.equipment), ''), 'other') FROM public.exercises e WHERE e.id = loser_id),
        'other'
      )
    WHERE exercise_id = loser_id;

    UPDATE public.workout_exercises
    SET
      exercise_id = survivor_id,
      equipment = COALESCE(
        NULLIF(trim(equipment), ''),
        (SELECT COALESCE(NULLIF(trim(e.equipment), ''), 'other') FROM public.exercises e WHERE e.id = loser_id),
        'other'
      )
    WHERE exercise_id = loser_id;

    UPDATE public.program_exercises
    SET
      exercise_id = survivor_id,
      equipment = COALESCE(
        NULLIF(trim(equipment), ''),
        (SELECT COALESCE(NULLIF(trim(e.equipment), ''), 'other') FROM public.exercises e WHERE e.id = loser_id),
        'other'
      )
    WHERE exercise_id = loser_id;

    UPDATE public.exercises
    SET wger_exercise_id = NULL
    WHERE id = loser_id AND wger_exercise_id IS NOT NULL;

    DELETE FROM public.exercises WHERE id = loser_id;
  END LOOP;
  END LOOP;

  -- singleton families: ensure equipment_options populated
  UPDATE public.exercises e
  SET equipment_options = ARRAY[COALESCE(NULLIF(trim(e.equipment), ''), 'other')]
  WHERE equipment_options = '{}'::text[] OR equipment_options IS NULL;
END $$;