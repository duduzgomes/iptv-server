--liquibase formatted sql
--changeset duduzgomes:010-alter-channels-num-unique
ALTER TABLE channels ADD CONSTRAINT uq_channels_num UNIQUE (num);