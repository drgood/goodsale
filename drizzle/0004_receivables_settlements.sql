-- Add settlement columns to shifts
ALTER TABLE shifts
  ADD COLUMN IF NOT EXISTS cash_settlements numeric(10,2) DEFAULT '0',
  ADD COLUMN IF NOT EXISTS card_settlements numeric(10,2) DEFAULT '0',
  ADD COLUMN IF NOT EXISTS mobile_settlements numeric(10,2) DEFAULT '0';

-- Extend debtor_history with method and idempotency key
ALTER TABLE debtor_history
  ADD COLUMN IF NOT EXISTS method varchar(50),
  ADD COLUMN IF NOT EXISTS idempotency_key varchar(100);

-- Optional: unique constraint for idempotency key to prevent duplicates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'debtor_history_idempotency_key_unique'
  ) THEN
    ALTER TABLE debtor_history ADD CONSTRAINT debtor_history_idempotency_key_unique UNIQUE (idempotency_key);
  END IF;
END $$;