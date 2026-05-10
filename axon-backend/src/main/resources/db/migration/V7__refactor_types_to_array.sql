-- V7: Update best practice types to support multiple values (array)
ALTER TABLE best_practices RENAME COLUMN type TO primary_type;
ALTER TABLE best_practices ADD COLUMN types TEXT[] NOT NULL DEFAULT '{}';

-- Migration data from old column to new array column
UPDATE best_practices SET types = ARRAY[primary_type];

-- Drop old column if no longer needed, but let's keep it as a backup for this turn or just drop it
ALTER TABLE best_practices DROP COLUMN primary_type;
