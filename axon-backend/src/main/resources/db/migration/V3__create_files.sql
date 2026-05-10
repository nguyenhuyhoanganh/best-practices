CREATE TABLE best_practice_files (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    best_practice_id UUID NOT NULL REFERENCES best_practices(id) ON DELETE CASCADE,
    file_name        VARCHAR(255) NOT NULL,
    file_size        BIGINT NOT NULL,
    mime_type        VARCHAR(100),
    storage_key      VARCHAR(500) NOT NULL,
    uploaded_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_files_bp_id ON best_practice_files(best_practice_id);
