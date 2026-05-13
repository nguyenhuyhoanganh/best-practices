-- V9: BP Review History
-- action=APPROVED: REQUESTED → PUBLISHED
-- action=REJECTED: REQUESTED → REJECTED (reviewer's comment required)
-- action=CLOSED:   PUBLISHED → REJECTED (supporter closes; close_reason in best_practices)
-- reviewer_id SET NULL on delete to preserve audit history if user is removed
CREATE TYPE review_action AS ENUM ('APPROVED', 'REJECTED', 'CLOSED');

CREATE TABLE bp_reviews (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bp_id       UUID NOT NULL REFERENCES best_practices(id),
    reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action      review_action NOT NULL,
    comment     TEXT,
    reviewed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reviews_bp_id ON bp_reviews(bp_id);
