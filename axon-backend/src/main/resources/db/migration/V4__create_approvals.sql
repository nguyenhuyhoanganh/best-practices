CREATE TABLE approvals (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    best_practice_id UUID NOT NULL REFERENCES best_practices(id),
    reviewer_id      UUID REFERENCES users(id),
    status           VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    comment          TEXT,
    reviewed_at      TIMESTAMP,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_approvals_bp_id ON approvals(best_practice_id);
CREATE INDEX idx_approvals_status ON approvals(status);
