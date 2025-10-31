ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_unique";--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "email_tenant_idx" ON "users" USING btree ("email","tenant_id");
