import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import * as schema from "../src/db/schema";
import * as fs from "fs";
import * as path from "path";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://travel:travel_secret@localhost:5432/travel_db";

const client = postgres(connectionString);
const db = drizzle(client, { schema });

interface ImageGroup {
  localDir: string;
  images: string[];
}

interface CleanSpot {
  name: string;
  description: string;
  imageGroups: ImageGroup[];
  sourceUrl: string;
  likedCount: string;
}

interface CleanAttractionPhoto {
  images: string[];
  sourceUrl: string;
  localDir: string;
  originalTitle: string;
}

interface CleanAttraction {
  cityName: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  hotScore: number;
  isPublished: boolean;
  spots: CleanSpot[];
  attractionPhotos: CleanAttractionPhoto[];
}

const cityCache = new Map<string, number>();

async function loadOrCreateCities(data: CleanAttraction[]) {
  const existingRows = await db.select().from(schema.cities);
  for (const row of existingRows) {
    cityCache.set(row.name, row.id);
  }

  const cityNames = new Set(data.map((d) => d.cityName));
  for (const name of cityNames) {
    if (!cityCache.has(name)) {
      const [created] = await db
        .insert(schema.cities)
        .values({ name, isPublished: false })
        .returning();
      cityCache.set(name, created.id);
      console.log(`Created city: ${name} (id=${created.id})`);
    }
  }
  console.log(`Cities loaded: ${cityCache.size}`);
}

async function cleanOldData() {
  await db.execute(sql`DELETE FROM photos WHERE source_platform = 'xhs'`);
  await db.execute(
    sql`DELETE FROM spots WHERE attraction_id IN (SELECT id FROM attractions WHERE id > 3)`
  );
  await db.execute(sql`DELETE FROM attractions WHERE id > 3`);
  console.log("Cleaned old xhs data");

  const uploadsDir = path.join(process.cwd(), "public", "uploads", "xhs");
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    for (const f of files) {
      fs.unlinkSync(path.join(uploadsDir, f));
    }
    console.log(`Deleted ${files.length} old uploaded images`);
  }
}

function copyImage(localDir: string, fileName: string, prefix: string): string {
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "xhs");
  fs.mkdirSync(uploadsDir, { recursive: true });

  const src = path.join(localDir, fileName);
  if (!fs.existsSync(src)) return "";

  const safeName = prefix.replace(/[^a-zA-Z0-9一-鿿]/g, "_").slice(0, 30);
  const destName = `${safeName}_${Date.now()}_${fileName}`;
  const dest = path.join(uploadsDir, destName);
  fs.copyFileSync(src, dest);
  return `/uploads/xhs/${destName}`;
}

async function importAttraction(item: CleanAttraction) {
  const cityId = cityCache.get(item.cityName);
  if (!cityId) {
    console.log(`  Skip: city "${item.cityName}" not found`);
    return;
  }

  // Copy all spot images first to get cover image
  const spotImageUrls: string[][] = [];
  for (const spot of item.spots) {
    const urls: string[] = [];
    for (const group of spot.imageGroups) {
      for (const img of group.images) {
        const url = copyImage(group.localDir, img, spot.name);
        if (url) urls.push(url);
      }
    }
    spotImageUrls.push(urls);
  }

  // Copy attraction-level photos
  const attrPhotoUrls: string[][] = [];
  for (const group of item.attractionPhotos) {
    const urls: string[] = [];
    for (const img of group.images) {
      const url = copyImage(group.localDir, img, item.name);
      if (url) urls.push(url);
    }
    attrPhotoUrls.push(urls);
  }

  const allUrls = [...spotImageUrls.flat(), ...attrPhotoUrls.flat()];
  const coverImage = allUrls[0] || null;

  const realSpotsCount = item.spots.length;

  const [attraction] = await db
    .insert(schema.attractions)
    .values({
      cityId,
      name: item.name,
      description: item.description,
      coverImage,
      latitude: String(item.latitude),
      longitude: String(item.longitude),
      hotScore: item.hotScore,
      spotsCount: realSpotsCount,
      isPublished: item.isPublished,
    })
    .returning();

  // Insert real spots (Type A)
  let spotPhotoCount = 0;
  for (let si = 0; si < item.spots.length; si++) {
    const spot = item.spots[si];
    const urls = spotImageUrls[si];
    if (urls.length === 0) continue;

    const [created] = await db
      .insert(schema.spots)
      .values({
        attractionId: attraction.id,
        name: spot.name,
        description: spot.description,
        coverImage: urls[0],
        difficulty: "easy",
        isPublished: true,
      })
      .returning();

    for (let i = 0; i < urls.length; i++) {
      await db.insert(schema.photos).values({
        spotId: created.id,
        attractionId: attraction.id,
        cityId,
        url: urls[i],
        alt: `${spot.name} - ${i + 1}`,
        sourcePlatform: "xhs",
        sourceUrl: spot.sourceUrl || null,
        sortOrder: i,
      });
      spotPhotoCount++;
    }
  }

  // Insert attraction-level photos (Type B, spot_id = null)
  let attrPhotoCount = 0;
  for (let gi = 0; gi < item.attractionPhotos.length; gi++) {
    const group = item.attractionPhotos[gi];
    const urls = attrPhotoUrls[gi];

    for (let i = 0; i < urls.length; i++) {
      await db.insert(schema.photos).values({
        spotId: null,
        attractionId: attraction.id,
        cityId,
        url: urls[i],
        alt: `${item.name} - ${group.originalTitle.slice(0, 20)} - ${i + 1}`,
        sourcePlatform: "xhs",
        sourceUrl: group.sourceUrl || null,
        sortOrder: 1000 + gi * 100 + i,
      });
      attrPhotoCount++;
    }
  }

  console.log(
    `  ${item.cityName}/${item.name}: ${realSpotsCount} spots(${spotPhotoCount} pics), ${item.attractionPhotos.length} groups(${attrPhotoCount} pics) [${item.isPublished ? "PUB" : "hide"}]`
  );
}

async function updateCityPublishStatus(data: CleanAttraction[]) {
  const publishedCities = new Set<string>();
  for (const item of data) {
    if (item.isPublished) {
      publishedCities.add(item.cityName);
    }
  }

  for (const [name, id] of cityCache) {
    const isPublished = publishedCities.has(name);
    await db
      .update(schema.cities)
      .set({ isPublished })
      .where(sql`${schema.cities.id} = ${id}`);
  }
  console.log(`Published cities: ${[...publishedCities].join(", ")}`);
}

async function main() {
  const dataPath = path.join(__dirname, "xhs", "data", "final_clean_data.json");
  if (!fs.existsSync(dataPath)) {
    console.error("final_clean_data.json not found. Run preprocess.ts first.");
    process.exit(1);
  }

  const data: CleanAttraction[] = JSON.parse(
    fs.readFileSync(dataPath, "utf-8")
  );
  console.log(`Loaded ${data.length} attractions from final_clean_data.json`);

  await loadOrCreateCities(data);
  await cleanOldData();

  let imported = 0;
  for (const item of data) {
    try {
      await importAttraction(item);
      imported++;
    } catch (err) {
      console.error(`  Error: ${item.name}: ${err}`);
    }
  }

  await updateCityPublishStatus(data);

  console.log(`\nDone: ${imported} attractions imported`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
