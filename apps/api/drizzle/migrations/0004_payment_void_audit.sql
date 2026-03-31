-- Migration: 0004_payment_void_audit
-- Goal: Automatically insert an audit record when a payment is voided
--       (voided_at transitions from NULL to a timestamp).

CREATE OR REPLACE FUNCTION record_payment_void()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.voided_at IS NOT NULL AND OLD.voided_at IS NULL THEN
        INSERT INTO audit (entity_type, entity_id, action, metadata)
        VALUES (
            'payment',
            NEW.id,
            'void',
            jsonb_build_object(
                'amount', NEW.amount::text,
                'contract_id', NEW.contract_id
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_payment_void_audit ON payments;
CREATE TRIGGER trg_payment_void_audit
AFTER UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION record_payment_void();
