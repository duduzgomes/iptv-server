CREATE TABLE access_logs (
    id             BIGSERIAL PRIMARY KEY,
    user_id        BIGINT      NOT NULL REFERENCES users(id),
    content_type   VARCHAR(20) NOT NULL,    -- LIVE | MOVIE | EPISODE
    content_id     BIGINT      NOT NULL,    -- id do canal/filme/episódio
    ip_address     VARCHAR(45) NOT NULL,
    connected_at   TIMESTAMP   NOT NULL DEFAULT NOW(),
    disconnected_at TIMESTAMP              -- null = ainda conectado
);

CREATE INDEX idx_access_logs_user
    ON access_logs(user_id, disconnected_at);

CREATE INDEX idx_access_logs_active
    ON access_logs(disconnected_at)
    WHERE disconnected_at IS NULL;