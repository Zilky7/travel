import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  decimal,
  timestamp,
  serial,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 100 }),
  avatarUrl: text("avatar_url"),
  role: varchar("role", { length: 20 }).default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const cities = pgTable("cities", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  nameEn: varchar("name_en", { length: 100 }),
  description: text("description"),
  coverImage: text("cover_image"),
  province: varchar("province", { length: 50 }),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  sortOrder: integer("sort_order").default(0).notNull(),
  isPublished: boolean("is_published").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const attractions = pgTable("attractions", {
  id: serial("id").primaryKey(),
  cityId: integer("city_id")
    .references(() => cities.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  coverImage: text("cover_image"),
  address: varchar("address", { length: 500 }),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  openHours: varchar("open_hours", { length: 200 }),
  ticketInfo: varchar("ticket_info", { length: 200 }),
  tips: text("tips"),
  hotScore: integer("hot_score").default(0).notNull(),
  spotsCount: integer("spots_count").default(0).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  isPublished: boolean("is_published").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const spots = pgTable("spots", {
  id: serial("id").primaryKey(),
  attractionId: integer("attraction_id")
    .references(() => attractions.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  coverImage: text("cover_image"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  bestTime: varchar("best_time", { length: 100 }),
  bestSeason: varchar("best_season", { length: 100 }),
  lightDirection: varchar("light_direction", { length: 100 }),
  compositionTips: text("composition_tips"),
  outfitTips: text("outfit_tips"),
  photoTips: text("photo_tips"),
  difficulty: varchar("difficulty", { length: 20 }).default("easy").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  isPublished: boolean("is_published").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  spotId: integer("spot_id").references(() => spots.id, {
    onDelete: "set null",
  }),
  attractionId: integer("attraction_id").references(() => attractions.id, {
    onDelete: "set null",
  }),
  cityId: integer("city_id").references(() => cities.id, {
    onDelete: "set null",
  }),
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  alt: varchar("alt", { length: 300 }),
  width: integer("width"),
  height: integer("height"),
  sourcePlatform: varchar("source_platform", { length: 50 }),
  sourceUrl: text("source_url"),
  sourceAuthor: varchar("source_author", { length: 100 }),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const guides = pgTable("guides", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  destination: varchar("destination", { length: 200 }).notNull(),
  guideType: varchar("guide_type", { length: 20 }).default("both").notNull(),
  prompt: text("prompt"),
  content: text("content").notNull(),
  durationDays: integer("duration_days"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const socialImports = pgTable("social_imports", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  platform: varchar("platform", { length: 30 }).notNull(),
  sourceUrl: text("source_url"),
  rawContent: text("raw_content").notNull(),
  parsedData: jsonb("parsed_data"),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  linkedSpotId: integer("linked_spot_id").references(() => spots.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userPosts = pgTable("user_posts", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  attractionId: integer("attraction_id")
    .references(() => attractions.id, { onDelete: "set null" }),
  spotId: integer("spot_id").references(() => spots.id, {
    onDelete: "set null",
  }),
  description: text("description"),
  photos: jsonb("photos").$type<string[]>().default([]).notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  deviceLatitude: decimal("device_latitude", { precision: 10, scale: 7 }),
  deviceLongitude: decimal("device_longitude", { precision: 10, scale: 7 }),
  aiVerified: varchar("ai_verified", { length: 20 }).default("pending").notNull(),
  aiResult: jsonb("ai_result"),
  status: varchar("status", { length: 20 }).default("published").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// -- Relations --

export const usersRelations = relations(users, ({ many }) => ({
  guides: many(guides),
  socialImports: many(socialImports),
  userPosts: many(userPosts),
}));

export const citiesRelations = relations(cities, ({ many }) => ({
  attractions: many(attractions),
  photos: many(photos),
}));

export const attractionsRelations = relations(
  attractions,
  ({ one, many }) => ({
    city: one(cities, {
      fields: [attractions.cityId],
      references: [cities.id],
    }),
    spots: many(spots),
    photos: many(photos),
  })
);

export const spotsRelations = relations(spots, ({ one, many }) => ({
  attraction: one(attractions, {
    fields: [spots.attractionId],
    references: [attractions.id],
  }),
  photos: many(photos),
  socialImports: many(socialImports),
}));

export const photosRelations = relations(photos, ({ one }) => ({
  spot: one(spots, { fields: [photos.spotId], references: [spots.id] }),
  attraction: one(attractions, {
    fields: [photos.attractionId],
    references: [attractions.id],
  }),
  city: one(cities, { fields: [photos.cityId], references: [cities.id] }),
}));

export const guidesRelations = relations(guides, ({ one }) => ({
  user: one(users, { fields: [guides.userId], references: [users.id] }),
}));

export const socialImportsRelations = relations(socialImports, ({ one }) => ({
  user: one(users, {
    fields: [socialImports.userId],
    references: [users.id],
  }),
  linkedSpot: one(spots, {
    fields: [socialImports.linkedSpotId],
    references: [spots.id],
  }),
}));

export const userPostsRelations = relations(userPosts, ({ one }) => ({
  user: one(users, {
    fields: [userPosts.userId],
    references: [users.id],
  }),
  attraction: one(attractions, {
    fields: [userPosts.attractionId],
    references: [attractions.id],
  }),
  spot: one(spots, {
    fields: [userPosts.spotId],
    references: [spots.id],
  }),
}));
