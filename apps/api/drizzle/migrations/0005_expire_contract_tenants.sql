-- Migration: 0005_expire_contract_tenants
-- Goal: Provide a DB-callable function that inactivates tenants whose contracts
--       have passed their end_date. The existing trg_tenant_expiration trigger
--       automatically sets expiration_date = now() + 10 years on the resulting
--       status transition to 'inactive'.

CREATE OR REPLACE FUNCTION expire_contract_tenants()
RETURNS integer AS $$
DECLARE
    affected_count integer;
BEGIN
    UPDATE tenants t
    SET status = 'inactive'
    FROM contracts c
    WHERE c.tenant_id = t.id
      AND c.end_date < CURRENT_DATE
      AND t.status = 'active';

    GET DIAGNOSTICS affected_count = ROW_COUNT;
    RETURN affected_count;
END;
$$ LANGUAGE plpgsql;
