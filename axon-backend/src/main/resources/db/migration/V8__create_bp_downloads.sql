-- V8: BP Downloads (async log after file stream succeeds)
-- download_count in best_practices updated async via @Async
CREATE TABLE bp_downloads (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bp_id         UUID NOT NULL REFERENCES best_practices(id),
    user_id       UUID NOT NULL REFERENCES users(id),
    downloaded_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_downloads_bp_id ON bp_downloads(bp_id);
CREATE INDEX idx_downloads_date  ON bp_downloads(downloaded_at DESC);
