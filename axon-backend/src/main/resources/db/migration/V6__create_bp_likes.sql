-- V6: BP Likes (toggle — unique per user per BP)
-- like_count in best_practices updated atomically via UPDATE ... SET like_count = like_count ± 1
CREATE TABLE bp_likes (
    bp_id      UUID NOT NULL REFERENCES best_practices(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (bp_id, user_id)
);
