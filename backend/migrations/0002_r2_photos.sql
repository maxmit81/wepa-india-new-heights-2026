ALTER TABLE photos ADD COLUMN storage_key TEXT;
CREATE INDEX IF NOT EXISTS photos_status_created ON photos(status,created_at,id);
