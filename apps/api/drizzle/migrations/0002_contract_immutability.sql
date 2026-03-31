-- Prevent mutation of protected fields on posted contracts
CREATE OR REPLACE FUNCTION prevent_posted_contract_mutation() RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'posted' THEN
        IF (NEW.start_date IS DISTINCT FROM OLD.start_date) OR
           (NEW.end_date IS DISTINCT FROM OLD.end_date) OR
           (NEW.rent_amount IS DISTINCT FROM OLD.rent_amount) OR
           (NEW.billing_frequency IS DISTINCT FROM OLD.billing_frequency) OR
           (NEW.due_date_rule IS DISTINCT FROM OLD.due_date_rule) THEN
            RAISE EXCEPTION 'Cannot modify protected fields of a posted contract (id: %)', OLD.id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_contract_immutability ON contracts;
CREATE TRIGGER trg_contract_immutability
BEFORE UPDATE ON contracts
FOR EACH ROW EXECUTE FUNCTION prevent_posted_contract_mutation();
