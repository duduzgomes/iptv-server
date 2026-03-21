
CREATE TABLE users (
    id               BIGSERIAL PRIMARY KEY,
    username         VARCHAR(50)  NOT NULL UNIQUE,
    password         VARCHAR(255) NOT NULL,
    max_connections  INT          NOT NULL DEFAULT 1,
    active           BOOLEAN      NOT NULL DEFAULT true,
    expires_at       TIMESTAMP    NOT NULL,
    created_by       BIGINT       REFERENCES admins(id),
    created_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP    NOT NULL DEFAULT NOW()
);
