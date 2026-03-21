CREATE TABLE channels (
    id             BIGSERIAL PRIMARY KEY,
    name           VARCHAR(100) NOT NULL,
    category_id    BIGINT       NOT NULL REFERENCES categories(id),
    logo_url       VARCHAR(500),
    source_url     VARCHAR(500) NOT NULL,  
    stream_key     VARCHAR(100) NOT NULL UNIQUE,
    epg_channel_id VARCHAR(100),          
    num            INT          NOT NULL,
    active         BOOLEAN      NOT NULL DEFAULT true,
    created_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP    NOT NULL DEFAULT NOW()
);