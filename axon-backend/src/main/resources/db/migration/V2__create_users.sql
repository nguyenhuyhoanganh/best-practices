-- V2: Users
-- department: VARCHAR string from CIP/AD SSO (no separate departments table)
-- last_login_at: activity tracking, updated on each successful auth
CREATE TYPE user_role AS ENUM ('USER', 'AX_CREATOR', 'AX_SUPPORTER', 'ADMIN');

CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) NOT NULL UNIQUE,
    name          VARCHAR(255) NOT NULL,
    cip_id        VARCHAR(100) UNIQUE,
    role          user_role NOT NULL DEFAULT 'USER',
    department    VARCHAR(256),
    avatar_url    VARCHAR(500),
    last_login_at TIMESTAMP,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email  ON users(email);
CREATE INDEX idx_users_cip_id ON users(cip_id);
