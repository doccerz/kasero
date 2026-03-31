-- Add name/email to admin_users for profile management
ALTER TABLE admin_users ADD COLUMN name text;
ALTER TABLE admin_users ADD COLUMN email text;

-- Add voided contract status (must run outside transaction in Postgres)
ALTER TYPE contract_status ADD VALUE IF NOT EXISTS 'voided';

-- Add billing_date_rule to contracts (day of month when bill is generated)
ALTER TABLE contracts ADD COLUMN billing_date_rule integer;

-- Add billing_date to payables (date when charge appears on ledger)
ALTER TABLE payables ADD COLUMN billing_date date;
