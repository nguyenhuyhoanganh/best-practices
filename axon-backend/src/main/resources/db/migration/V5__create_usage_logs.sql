CREATE TABLE usage_logs (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    best_practice_id UUID NOT NULL REFERENCES best_practices(id),
    user_id          UUID NOT NULL REFERENCES users(id),
    action           VARCHAR(20) NOT NULL,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_usage_bp_id ON usage_logs(best_practice_id);
CREATE INDEX idx_usage_created_at ON usage_logs(created_at DESC);
