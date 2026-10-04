ALTER TABLE "scenarios" ADD COLUMN "practice_area" text;--> statement-breakpoint
ALTER TABLE "scenarios" ADD COLUMN "active" boolean DEFAULT true NOT NULL;