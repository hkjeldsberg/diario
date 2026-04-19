-- Run this SQL in the Supabase dashboard SQL editor

CREATE TABLE IF NOT EXISTS sofia.letters (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title       text NOT NULL,
  content     text NOT NULL DEFAULT '',
  written_at  date NOT NULL DEFAULT CURRENT_DATE,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS letters_written_at_idx ON sofia.letters (written_at DESC);
