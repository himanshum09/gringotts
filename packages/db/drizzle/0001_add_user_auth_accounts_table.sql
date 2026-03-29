CREATE TYPE "public"."user_auth_account_provider" AS ENUM('credentials', 'google', 'github', 'microsoft');--> statement-breakpoint
CREATE TABLE "user_auth_accounts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_identity_id" uuid NOT NULL,
	"provider" "user_auth_account_provider" DEFAULT 'credentials' NOT NULL,
	"provider_account_id" text,
	"password_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_identities" DROP CONSTRAINT "user_identities_email_unique";--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "user_identity_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_auth_accounts" ADD CONSTRAINT "user_auth_accounts_user_identity_id_user_identities_id_fk" FOREIGN KEY ("user_identity_id") REFERENCES "public"."user_identities"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "idx_user_auth_accounts_user_identity_id" ON "user_auth_accounts" USING btree ("user_identity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_user_auth_accounts_identity_provider" ON "user_auth_accounts" USING btree ("user_identity_id","provider");