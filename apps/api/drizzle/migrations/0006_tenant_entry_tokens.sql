ALTER TABLE tenants ADD COLUMN entry_token uuid;
ALTER TABLE tenants ADD COLUMN entry_token_used_at timestamp;
CREATE UNIQUE INDEX IF NOT EXISTS uq_tenant_entry_token ON tenants(entry_token) WHERE entry_token IS NOT NULL;
