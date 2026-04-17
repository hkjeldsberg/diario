-- MANUAL STEPS REQUIRED:
-- 1. Run this SQL in the Supabase dashboard SQL editor
-- 2. Go to Settings → API → Extra Search Path → add "sofia"
-- 3. Create a Storage bucket named "diario-media" with public read access
-- 4. Enable RLS on the entries table if needed (default: disabled for service-role key)

-- Create the sofia schema
CREATE SCHEMA IF NOT EXISTS sofia;

-- Grant usage to service_role (Supabase uses this for service-role key access)
GRANT USAGE ON SCHEMA sofia TO service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA sofia TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA sofia TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA sofia GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA sofia GRANT ALL ON SEQUENCES TO service_role;

-- Create the entries table
CREATE TABLE IF NOT EXISTS sofia.entries (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date        date NOT NULL,
  text        text,
  media_urls  text[] DEFAULT '{}',
  created_at  timestamptz DEFAULT now()
);

-- Index for date-range queries (diary tab filtering)
CREATE INDEX IF NOT EXISTS entries_date_idx ON sofia.entries (date);
