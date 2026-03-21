CREATE TABLE series (
    id            BIGSERIAL PRIMARY KEY,
    tmdb_id       INT          NOT NULL UNIQUE,
    category_id   BIGINT       NOT NULL REFERENCES categories(id),
    title         VARCHAR(255) NOT NULL,
    synopsis      TEXT,
    genre         VARCHAR(255),
    cast          TEXT,
    rating        DECIMAL(3,1),
    poster_url    VARCHAR(500),
    backdrop_url  VARCHAR(500),
    trailer_url   VARCHAR(500),
    status        VARCHAR(50),             
    active        BOOLEAN      NOT NULL DEFAULT true,
    tmdb_updated_at TIMESTAMP,
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE seasons (
    id          BIGSERIAL PRIMARY KEY,
    series_id   BIGINT NOT NULL REFERENCES series(id) ON DELETE CASCADE,
    tmdb_id     INT,
    number      INT    NOT NULL,     
    title       VARCHAR(255),
    synopsis    TEXT,
    poster_url  VARCHAR(500),
    year        INT,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE episodes (
    id           BIGSERIAL PRIMARY KEY,
    season_id    BIGINT       NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    tmdb_id      INT,
    number       INT          NOT NULL,   
    title        VARCHAR(255) NOT NULL,
    synopsis     TEXT,
    poster_url   VARCHAR(500),
    duration     INT,                 
    air_date     DATE,
    file_path    VARCHAR(500),          
    active       BOOLEAN      NOT NULL DEFAULT true,
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);