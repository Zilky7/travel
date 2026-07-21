CREATE TABLE "attractions" (
	"id" serial PRIMARY KEY NOT NULL,
	"city_id" integer NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"cover_image" text,
	"address" varchar(500),
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"open_hours" varchar(200),
	"ticket_info" varchar(200),
	"tips" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"name_en" varchar(100),
	"description" text,
	"cover_image" text,
	"province" varchar(50),
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guides" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"destination" varchar(200) NOT NULL,
	"guide_type" varchar(20) DEFAULT 'both' NOT NULL,
	"prompt" text,
	"content" text NOT NULL,
	"duration_days" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "photos" (
	"id" serial PRIMARY KEY NOT NULL,
	"spot_id" integer,
	"attraction_id" integer,
	"city_id" integer,
	"url" text NOT NULL,
	"thumbnail_url" text,
	"alt" varchar(300),
	"width" integer,
	"height" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_imports" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"platform" varchar(30) NOT NULL,
	"source_url" text,
	"raw_content" text NOT NULL,
	"parsed_data" jsonb,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"linked_spot_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spots" (
	"id" serial PRIMARY KEY NOT NULL,
	"attraction_id" integer NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"cover_image" text,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"best_time" varchar(100),
	"best_season" varchar(100),
	"light_direction" varchar(100),
	"composition_tips" text,
	"outfit_tips" text,
	"photo_tips" text,
	"difficulty" varchar(20) DEFAULT 'easy' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"name" varchar(100),
	"avatar_url" text,
	"role" varchar(20) DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "attractions" ADD CONSTRAINT "attractions_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guides" ADD CONSTRAINT "guides_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photos" ADD CONSTRAINT "photos_spot_id_spots_id_fk" FOREIGN KEY ("spot_id") REFERENCES "public"."spots"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photos" ADD CONSTRAINT "photos_attraction_id_attractions_id_fk" FOREIGN KEY ("attraction_id") REFERENCES "public"."attractions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photos" ADD CONSTRAINT "photos_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_imports" ADD CONSTRAINT "social_imports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_imports" ADD CONSTRAINT "social_imports_linked_spot_id_spots_id_fk" FOREIGN KEY ("linked_spot_id") REFERENCES "public"."spots"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spots" ADD CONSTRAINT "spots_attraction_id_attractions_id_fk" FOREIGN KEY ("attraction_id") REFERENCES "public"."attractions"("id") ON DELETE cascade ON UPDATE no action;