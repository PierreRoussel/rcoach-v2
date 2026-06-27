-- Must run in its own migration: new enum values cannot be used until committed.
ALTER TYPE public.food_source ADD VALUE IF NOT EXISTS 'ciqual';
