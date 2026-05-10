-- V6: Seed Admin User
INSERT INTO users (id, email, name, role, sso_provider, sso_subject, avatar_url)
VALUES (gen_random_uuid(), 'dev@company.com', 'Dev Admin', 'ADMIN', 'mock', 'mock-sub-001', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dev')
ON CONFLICT (sso_provider, sso_subject) DO UPDATE SET role = 'ADMIN';
