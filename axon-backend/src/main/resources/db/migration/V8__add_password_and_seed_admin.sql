-- V8: Add password column and seed default admin
ALTER TABLE users ADD COLUMN password VARCHAR(255);

-- Seed admin/12345678 (BCrypt hash of 12345678)
INSERT INTO users (id, email, name, role, password, created_at)
VALUES ('550e8400-e29b-41d4-a716-446655440001', 'admin@axon.com', 'Admin', 'ADMIN', '$2a$10$Uhue2sxrIBqBMTHkUZXyEOlq33vzbm3O5bQUXeiOVuumK9kVi/KP2', NOW())
ON CONFLICT (email) DO UPDATE SET password = '$2a$10$Uhue2sxrIBqBMTHkUZXyEOlq33vzbm3O5bQUXeiOVuumK9kVi/KP2', role = 'ADMIN';
