-- Make coaching_cache more flexible for caching all AI responses
ALTER TABLE coaching_cache ALTER COLUMN question_id DROP NOT NULL;
ALTER TABLE coaching_cache ADD COLUMN IF NOT EXISTS cache_key text;

-- Drop old unique constraint and create new one  
ALTER TABLE coaching_cache DROP CONSTRAINT IF EXISTS coaching_cache_question_id_action_key;
CREATE UNIQUE INDEX IF NOT EXISTS coaching_cache_flexible_key_idx ON coaching_cache (COALESCE(question_id::text, ''), COALESCE(cache_key, ''), action);