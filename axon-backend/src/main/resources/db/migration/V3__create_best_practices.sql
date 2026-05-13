-- V3: Best Practices
-- submitted_at: set when BP transitions to REQUESTED status (management queue sorts by this, not created_at)
-- close_reason: populated when supporter closes a PUBLISHED BP (action=CLOSED in bp_reviews)
-- No CLOSED status — close action sets status=REJECTED; differentiated via bp_reviews.action=CLOSED
CREATE TYPE bp_type   AS ENUM ('WEB', 'TOOL', 'EXTENSION');
CREATE TYPE bp_status AS ENUM ('REQUESTED', 'REJECTED', 'PUBLISHED');

CREATE TABLE best_practices (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                 VARCHAR(200) NOT NULL,
    description          TEXT,
    thumbnail_url        VARCHAR(500),
    installation_guide   TEXT,
    type                 bp_type NOT NULL,
    web_content          VARCHAR(256),
    key_value            TEXT,
    ai_tools_description TEXT,
    work_id              UUID REFERENCES works(id),
    status               bp_status NOT NULL DEFAULT 'REQUESTED',
    close_reason         TEXT,
    submitted_at         TIMESTAMP,
    view_count           INT NOT NULL DEFAULT 0,
    like_count           INT NOT NULL DEFAULT 0,
    download_count       INT NOT NULL DEFAULT 0,
    created_at           TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMP NOT NULL DEFAULT NOW(),
    published_at         TIMESTAMP
);

CREATE INDEX idx_bp_status          ON best_practices(status);
CREATE INDEX idx_bp_type            ON best_practices(type);
CREATE INDEX idx_bp_work            ON best_practices(work_id);
CREATE INDEX idx_bp_like_count      ON best_practices(like_count DESC);
CREATE INDEX idx_bp_view_count      ON best_practices(view_count DESC);
CREATE INDEX idx_bp_published_at    ON best_practices(published_at DESC);
CREATE INDEX idx_bp_submitted_at    ON best_practices(submitted_at DESC);
