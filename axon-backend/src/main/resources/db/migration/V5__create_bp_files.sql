-- V5: BP Files (stored on Docker volume local filesystem — no MinIO)
-- file_path: absolute path within Docker volume /app/uploads/{bpId}/{uuid}_{original_filename}
-- uploaded_by: track which creator uploaded (multiple creators can upload files)
CREATE TABLE bp_files (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bp_id       UUID NOT NULL REFERENCES best_practices(id) ON DELETE CASCADE,
    file_name   VARCHAR(255) NOT NULL,
    file_size   BIGINT NOT NULL,
    mime_type   VARCHAR(100),
    file_path   VARCHAR(500) NOT NULL,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bp_files_bp_id ON bp_files(bp_id);
