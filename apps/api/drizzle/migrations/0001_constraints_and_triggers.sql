-- One active contract per space
CREATE UNIQUE INDEX IF NOT EXISTS uq_space_one_active_contract ON contracts(space_id) WHERE status = 'posted';

-- Tenant expiration trigger
CREATE OR REPLACE FUNCTION set_tenant_expiration() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'inactive' AND (OLD.status IS DISTINCT FROM 'inactive') THEN
        NEW.expiration_date := CURRENT_DATE + INTERVAL '10 years';
    ELSIF NEW.status = 'active' THEN
        NEW.expiration_date := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tenant_expiration ON tenants;
CREATE TRIGGER trg_tenant_expiration
BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION set_tenant_expiration();
