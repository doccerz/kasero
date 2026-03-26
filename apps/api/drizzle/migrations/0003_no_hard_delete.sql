-- Prevent hard deletes on core records
CREATE OR REPLACE FUNCTION prevent_hard_delete() RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Hard deletes are not allowed on table "%" (id: %). Use soft-delete or status transitions instead.', TG_TABLE_NAME, OLD.id;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_no_delete_tenants ON tenants;
CREATE TRIGGER trg_no_delete_tenants
BEFORE DELETE ON tenants
FOR EACH ROW EXECUTE FUNCTION prevent_hard_delete();

DROP TRIGGER IF EXISTS trg_no_delete_contracts ON contracts;
CREATE TRIGGER trg_no_delete_contracts
BEFORE DELETE ON contracts
FOR EACH ROW EXECUTE FUNCTION prevent_hard_delete();

DROP TRIGGER IF EXISTS trg_no_delete_payments ON payments;
CREATE TRIGGER trg_no_delete_payments
BEFORE DELETE ON payments
FOR EACH ROW EXECUTE FUNCTION prevent_hard_delete();

DROP TRIGGER IF EXISTS trg_no_delete_fund ON fund;
CREATE TRIGGER trg_no_delete_fund
BEFORE DELETE ON fund
FOR EACH ROW EXECUTE FUNCTION prevent_hard_delete();

DROP TRIGGER IF EXISTS trg_no_delete_payables ON payables;
CREATE TRIGGER trg_no_delete_payables
BEFORE DELETE ON payables
FOR EACH ROW EXECUTE FUNCTION prevent_hard_delete();

DROP TRIGGER IF EXISTS trg_no_delete_public_access_codes ON public_access_codes;
CREATE TRIGGER trg_no_delete_public_access_codes
BEFORE DELETE ON public_access_codes
FOR EACH ROW EXECUTE FUNCTION prevent_hard_delete();

DROP TRIGGER IF EXISTS trg_no_delete_audit ON audit;
CREATE TRIGGER trg_no_delete_audit
BEFORE DELETE ON audit
FOR EACH ROW EXECUTE FUNCTION prevent_hard_delete();
