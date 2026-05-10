CREATE TABLE best_practices (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title             VARCHAR(200) NOT NULL,
    description       TEXT,
    type              VARCHAR(50) NOT NULL,
    status            VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    author_id         UUID NOT NULL REFERENCES users(id),
    usage_guide       TEXT,
    install_guide     TEXT,
    external_links    JSONB NOT NULL DEFAULT '[]'::jsonb,
    agent_workflow_id VARCHAR(100),
    tags              TEXT[] NOT NULL DEFAULT '{}',
    view_count        INTEGER NOT NULL DEFAULT 0,
    download_count    INTEGER NOT NULL DEFAULT 0,
    usage_score       FLOAT NOT NULL DEFAULT 0.0,
    created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    published_at      TIMESTAMP
);

CREATE INDEX idx_bp_status ON best_practices(status);
CREATE INDEX idx_bp_type ON best_practices(type);
CREATE INDEX idx_bp_usage_score ON best_practices(usage_score DESC);
CREATE INDEX idx_bp_author ON best_practices(author_id);
CREATE INDEX idx_bp_tags ON best_practices USING GIN(tags);
