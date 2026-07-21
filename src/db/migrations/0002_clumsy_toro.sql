CREATE TABLE "user_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"attraction_id" integer,
	"spot_id" integer,
	"description" text,
	"photos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"ai_verified" varchar(20) DEFAULT 'pending' NOT NULL,
	"ai_result" jsonb,
	"status" varchar(20) DEFAULT 'published' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attractions" ADD COLUMN "hot_score" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "attractions" ADD COLUMN "spots_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_posts" ADD CONSTRAINT "user_posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_posts" ADD CONSTRAINT "user_posts_attraction_id_attractions_id_fk" FOREIGN KEY ("attraction_id") REFERENCES "public"."attractions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_posts" ADD CONSTRAINT "user_posts_spot_id_spots_id_fk" FOREIGN KEY ("spot_id") REFERENCES "public"."spots"("id") ON DELETE set null ON UPDATE no action;