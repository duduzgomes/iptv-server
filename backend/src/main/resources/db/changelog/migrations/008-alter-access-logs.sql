--liquibase formatted sql

--changeset duduzgomes:009-alter-access-logs
ALTER TABLE access_logs
    ADD COLUMN expires_at TIMESTAMP,
    ADD COLUMN ip_user_agent VARCHAR(500);

CREATE INDEX idx_access_logs_expires
    ON access_logs(expires_at)
    WHERE disconnected_at IS NULL;
--rollback ALTER TABLE access_logs DROP COLUMN expires_at, DROP COLUMN ip_user_agent;