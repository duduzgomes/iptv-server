--liquibase formatted sql

--changeset duduzgomes:010-alter-vod-status
ALTER TABLE movies
    ADD COLUMN vod_status  VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    ADD COLUMN minio_key   VARCHAR(500),
    ADD COLUMN hls_path    VARCHAR(500);

ALTER TABLE episodes
    ADD COLUMN vod_status  VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    ADD COLUMN minio_key   VARCHAR(500),
    ADD COLUMN hls_path    VARCHAR(500);
--rollback ALTER TABLE movies DROP COLUMN vod_status, DROP COLUMN minio_key, DROP COLUMN hls_path;
--rollback ALTER TABLE episodes DROP COLUMN vod_status, DROP COLUMN minio_key, DROP COLUMN hls_path;