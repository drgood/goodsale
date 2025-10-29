ALTER TABLE "users" DROP CONSTRAINT "users_email_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "email_tenant_idx" ON "users" USING btree ("email","tenant_id");