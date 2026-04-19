CREATE TYPE "public"."transaction_status" AS ENUM('pending', 'posted', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('debit', 'credit');--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"financial_account_id" uuid NOT NULL,
	"user_identity_id" uuid NOT NULL,
	"category_id" uuid,
	"amount" numeric(18, 2) NOT NULL,
	"currency" text NOT NULL,
	"type" "transaction_type" NOT NULL,
	"status" "transaction_status" DEFAULT 'posted' NOT NULL,
	"payee" text,
	"description" text,
	"note" text,
	"reference_id" text,
	"date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transaction_categories" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_identity_id" uuid,
	"name" text NOT NULL,
	"icon" text,
	"color" text,
	"is_system" boolean DEFAULT false NOT NULL,
	"parent_category_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_financial_account_id_financial_accounts_id_fk" FOREIGN KEY ("financial_account_id") REFERENCES "public"."financial_accounts"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_identity_id_user_identities_id_fk" FOREIGN KEY ("user_identity_id") REFERENCES "public"."user_identities"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_transaction_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."transaction_categories"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "transaction_categories" ADD CONSTRAINT "transaction_categories_user_identity_id_user_identities_id_fk" FOREIGN KEY ("user_identity_id") REFERENCES "public"."user_identities"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "transaction_categories" ADD CONSTRAINT "transaction_categories_parent_category_id_transaction_categories_id_fk" FOREIGN KEY ("parent_category_id") REFERENCES "public"."transaction_categories"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "idx_transactions_financial_account_id" ON "transactions" USING btree ("financial_account_id");--> statement-breakpoint
CREATE INDEX "idx_transactions_user_identity_id" ON "transactions" USING btree ("user_identity_id");--> statement-breakpoint
CREATE INDEX "idx_transactions_date" ON "transactions" USING btree ("date");--> statement-breakpoint
CREATE INDEX "idx_transactions_category_id" ON "transactions" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_transactions_account_date" ON "transactions" USING btree ("financial_account_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_transactions_account_reference_id" ON "transactions" USING btree ("financial_account_id","reference_id") WHERE "transactions"."reference_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_transaction_categories_user_identity_id" ON "transaction_categories" USING btree ("user_identity_id");--> statement-breakpoint
CREATE INDEX "idx_transaction_categories_parent_category_id" ON "transaction_categories" USING btree ("parent_category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_transaction_categories_system_name" ON "transaction_categories" USING btree ("name") WHERE "transaction_categories"."user_identity_id" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_transaction_categories_user_name" ON "transaction_categories" USING btree ("user_identity_id","name") WHERE "transaction_categories"."user_identity_id" IS NOT NULL;