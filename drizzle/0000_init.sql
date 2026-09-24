CREATE TABLE "attempt_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attempt_id" uuid NOT NULL,
	"turn" integer NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"mood" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"scenario_id" text NOT NULL,
	"mode" text NOT NULL,
	"target_level" text NOT NULL,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"mood" text DEFAULT 'calm' NOT NULL,
	"objectives_met" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"hints_used" integer DEFAULT 0 NOT NULL,
	"overall_score" real,
	"verdict" text,
	"retry_of_attempt_id" uuid,
	"retry_from_turn" integer,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "competency_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"competency" text NOT NULL,
	"score" real NOT NULL,
	"attempt_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competency_scores" (
	"user_id" uuid NOT NULL,
	"competency" text NOT NULL,
	"score" real NOT NULL,
	"self_rating" real,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "competency_scores_user_id_competency_pk" PRIMARY KEY("user_id","competency")
);
--> statement-breakpoint
CREATE TABLE "development_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"focus" text NOT NULL,
	"weeks" jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback_reports" (
	"attempt_id" uuid PRIMARY KEY NOT NULL,
	"summary" text NOT NULL,
	"criteria" jsonb NOT NULL,
	"moments" jsonb NOT NULL,
	"top_behaviours" jsonb NOT NULL,
	"competency_deltas" jsonb NOT NULL,
	"readiness_before" integer NOT NULL,
	"readiness_after" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_progress" (
	"user_id" uuid NOT NULL,
	"lesson_id" text NOT NULL,
	"quiz_score" integer,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_progress_user_id_lesson_id_pk" PRIMARY KEY("user_id","lesson_id")
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" text PRIMARY KEY NOT NULL,
	"track_id" text NOT NULL,
	"title" text NOT NULL,
	"level" text NOT NULL,
	"duration_min" integer NOT NULL,
	"order" integer NOT NULL,
	"blocks" jsonb NOT NULL,
	"practice_scenario_id" text
);
--> statement-breakpoint
CREATE TABLE "personas" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"title" text NOT NULL,
	"company" text NOT NULL,
	"personality" text NOT NULL,
	"avatar_key" text NOT NULL,
	"brief" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "red_pen_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"deliverable_type" text NOT NULL,
	"target_level" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"result" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rubrics" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"criteria" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scenarios" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"persona_id" text,
	"rubric_id" text NOT NULL,
	"target_level" text NOT NULL,
	"difficulty" integer NOT NULL,
	"duration_min" integer NOT NULL,
	"competencies" jsonb NOT NULL,
	"briefing" jsonb NOT NULL,
	"objectives" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"opening_line" text,
	"max_turns" integer DEFAULT 12 NOT NULL,
	"case_pack" jsonb,
	"is_pro" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "storyboards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"scenario_id" text NOT NULL,
	"attempt_id" uuid,
	"stage" text DEFAULT 'pyramid' NOT NULL,
	"pyramid" jsonb,
	"slides" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"comments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tracks" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"competency" text NOT NULL,
	"order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"current_level" text DEFAULT 'analyst' NOT NULL,
	"target_level" text,
	"target_date" date,
	"goal" text,
	"weekly_rep_goal" integer DEFAULT 5 NOT NULL,
	"coach_tone" text DEFAULT 'direct' NOT NULL,
	"onboarded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "attempt_messages" ADD CONSTRAINT "attempt_messages_attempt_id_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_scenario_id_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."scenarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competency_history" ADD CONSTRAINT "competency_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competency_scores" ADD CONSTRAINT "competency_scores_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "development_plans" ADD CONSTRAINT "development_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_reports" ADD CONSTRAINT "feedback_reports_attempt_id_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_track_id_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_practice_scenario_id_scenarios_id_fk" FOREIGN KEY ("practice_scenario_id") REFERENCES "public"."scenarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "red_pen_reviews" ADD CONSTRAINT "red_pen_reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_persona_id_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "public"."personas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_rubric_id_rubrics_id_fk" FOREIGN KEY ("rubric_id") REFERENCES "public"."rubrics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storyboards" ADD CONSTRAINT "storyboards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storyboards" ADD CONSTRAINT "storyboards_scenario_id_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."scenarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storyboards" ADD CONSTRAINT "storyboards_attempt_id_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."attempts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attempt_messages_attempt_idx" ON "attempt_messages" USING btree ("attempt_id","turn");--> statement-breakpoint
CREATE INDEX "attempts_user_idx" ON "attempts" USING btree ("user_id","started_at");--> statement-breakpoint
CREATE INDEX "competency_history_user_idx" ON "competency_history" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "red_pen_reviews_user_idx" ON "red_pen_reviews" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "storyboards_user_idx" ON "storyboards" USING btree ("user_id","scenario_id");