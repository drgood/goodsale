CREATE TABLE IF NOT EXISTS "platform_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform_name" varchar(255) DEFAULT 'GoodSale' NOT NULL,
	"logo_url" text,
	"currency" varchar(10) DEFAULT 'ghs' NOT NULL,
	"tax_rate" numeric(5, 2) DEFAULT '8' NOT NULL,
	"enforce_mfa" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
