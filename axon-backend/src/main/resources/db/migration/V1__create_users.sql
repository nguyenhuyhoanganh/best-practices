CREATE TABLE users (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email        VARCHAR(255) NOT NULL UNIQUE,
    name         VARCHAR(255) NOT NULL,
    role         VARCHAR(20) NOT NULL DEFAULT 'USER',
    sso_provider VARCHAR(50),
    sso_subject  VARCHAR(255),
    avatar_url   VARCHAR(500),
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (sso_provider, sso_subject)
);

CREATE INDEX idx_users_email ON users(email);
