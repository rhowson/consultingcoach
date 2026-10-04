CREATE TABLE "interview_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"interview_id" uuid NOT NULL,
	"section_id" text,
	"type" text NOT NULL,
	"content" text,
	"meta" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_hash" text NOT NULL,
	"pack_id" text NOT NULL,
	"candidate_name" text NOT NULL,
	"candidate_email" text,
	"target_level" text NOT NULL,
	"created_by" uuid,
	"status" text DEFAULT 'invited' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consent_at" timestamp with time zone,
	"started_at" timestamp with time zone,
	"submitted_at" timestamp with time zone,
	"sections" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"result" jsonb,
	"scoring_model" text,
	"scoring_error" text,
	"assessor_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "interviews_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "interview_events" ADD CONSTRAINT "interview_events_interview_id_interviews_id_fk" FOREIGN KEY ("interview_id") REFERENCES "public"."interviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "interview_events_interview_idx" ON "interview_events" USING btree ("interview_id","created_at");--> statement-breakpoint
CREATE INDEX "interviews_created_by_idx" ON "interviews" USING btree ("created_by","created_at");