CREATE TABLE categories (
    id           BIGSERIAL PRIMARY KEY,
    name         VARCHAR(100) NOT NULL,
    content_type VARCHAR(20)  NOT NULL,  -- LIVE | VOD | SERIES
    active       BOOLEAN      NOT NULL DEFAULT true,
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);