-- ============================================
-- Add collapsed column to notes table
-- ============================================

-- Add collapsed column (default: false = expanded state)
ALTER TABLE notes
ADD COLUMN IF NOT EXISTS collapsed BOOLEAN DEFAULT false;

-- Create index for collapsed column (optional, for performance)
CREATE INDEX IF NOT EXISTS idx_notes_collapsed ON notes(collapsed);

-- ============================================
-- Instructions for Supabase Dashboard:
-- ============================================
-- 1. Go to Supabase Dashboard
-- 2. Select your project
-- 3. Go to SQL Editor
-- 4. Create a new query
-- 5. Copy and paste this SQL
-- 6. Run the query
-- 7. Verify: Go to Table Editor > notes table > Check if 'collapsed' column exists
