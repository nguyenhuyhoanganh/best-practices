-- V4: Junction tables
-- bp_creators: multiple creators per BP; self-approve check uses this table
-- bp_jobs: BP can target multiple jobs
-- bp_ai_capabilities: BP can use multiple AI capabilities
CREATE TABLE bp_creators (
    bp_id   UUID NOT NULL REFERENCES best_practices(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    PRIMARY KEY (bp_id, user_id)
);

CREATE TABLE bp_jobs (
    bp_id  UUID NOT NULL REFERENCES best_practices(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id),
    PRIMARY KEY (bp_id, job_id)
);

CREATE TABLE bp_ai_capabilities (
    bp_id            UUID NOT NULL REFERENCES best_practices(id) ON DELETE CASCADE,
    ai_capability_id UUID NOT NULL REFERENCES ai_capabilities(id),
    PRIMARY KEY (bp_id, ai_capability_id)
);
