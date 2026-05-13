-- V7: BP Feedback (only allowed on PUBLISHED BPs, max 2000 chars)
CREATE TABLE bp_feedback (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bp_id      UUID NOT NULL REFERENCES best_practices(id),
    user_id    UUID NOT NULL REFERENCES users(id),
    content    TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_feedback_bp_id ON bp_feedback(bp_id);
