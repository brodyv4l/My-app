-- Fasting logs + sobriety columns (run in Supabase SQL editor)

CREATE TABLE IF NOT EXISTS fasting_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_hours FLOAT,
  date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE fasting_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own data" ON fasting_logs;
CREATE POLICY "own data" ON fasting_logs
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE food_logs ADD COLUMN IF NOT EXISTS serving_amount FLOAT;
ALTER TABLE food_logs ADD COLUMN IF NOT EXISTS serving_unit TEXT;
ALTER TABLE food_logs ADD COLUMN IF NOT EXISTS serving_grams FLOAT;

ALTER TABLE users ADD COLUMN IF NOT EXISTS show_sobriety_tracker BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS sobriety_streak_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS sobriety_last_clean_date DATE;
