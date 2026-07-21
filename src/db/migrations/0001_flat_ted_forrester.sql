ALTER TABLE "photos" ADD COLUMN "source_platform" varchar(50);--> statement-breakpoint
ALTER TABLE "photos" ADD COLUMN "source_url" text;--> statement-breakpoint
ALTER TABLE "photos" ADD COLUMN "source_author" varchar(100);