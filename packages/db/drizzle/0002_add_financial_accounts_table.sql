CREATE TYPE "public"."financial_account_type" AS ENUM('savings_account', 'current_account', 'credit_card', 'wallet', 'investment', 'loan');--> statement-breakpoint
CREATE TABLE "financial_accounts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_identity_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" "financial_account_type" NOT NULL,
	"currency" text NOT NULL,
	"credit_limit" numeric(18, 2),
	"balance" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"institution_name" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "financial_accounts" ADD CONSTRAINT "financial_accounts_user_identity_id_user_identities_id_fk" FOREIGN KEY ("user_identity_id") REFERENCES "public"."user_identities"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "idx_financial_accounts_user_identity_id" ON "financial_accounts" USING btree ("user_identity_id");