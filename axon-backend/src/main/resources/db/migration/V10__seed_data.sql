-- V10: Seed data per DLD §1.2 (V10)
-- 4 jobs, 5 AI capabilities (all is_default=true)
INSERT INTO jobs (name, display_order) VALUES
    ('Code Implementation', 1),
    ('Research',            2),
    ('Operation',           3),
    ('Report',              4);

INSERT INTO ai_capabilities (name, is_default, display_order) VALUES
    ('Q&A',                          TRUE, 1),
    ('Workflow Assistant',            TRUE, 2),
    ('Autonomous AI Agent',           TRUE, 3),
    ('AI-based Tools & Applications', TRUE, 4),
    ('AI Orchestration',              TRUE, 5);
