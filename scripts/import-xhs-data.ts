import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, gt, sql } from "drizzle-orm";
import * as schema from "../src/db/schema";
import * as fs from "fs";
import * as path from "path";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://travel:travel_secret@localhost:5432/travel_db";

const client = postgres(connectionString);
const db = drizzle(client, { schema });

interface ProcessedSpot {
  name: string;
  description: string;
  images: string[];
  compositionTips: string;
  outfitTips: string;
  photoTips: string;
  likedCount: string;
  sourceUrl: string;
  localDir: string;
}

interface ProcessedAttraction {
  cityName: string;
  attractionName: string;
  description: string;
  coverImage: string;
  latitude: number;
  longitude: number;
  hotScore: number;
  spots: ProcessedSpot[];
}

const cityCache = new Map<string, number>();

async function loadCities() {
  const rows = await db.select().from(schema.cities);
  for (const row of rows) {
    cityCache.set(row.name, row.id);
  }
  console.log(`Loaded ${cityCache.size} cities`);
}

async function cleanAllXhsData() {
  const deleted_photos = await db.delete(schema.photos).where(
    sql`${schema.photos.sourcePlatform} = 'xhs' OR ${schema.photos.spotId} IN (
      SELECT s.id FROM spots s JOIN attractions a ON s.attraction_id = a.id WHERE a.id > 3
    )`
  );
  const deleted_spots = await db.delete(schema.spots).where(
    sql`${schema.spots.attractionId} IN (SELECT id FROM attractions WHERE id > 3)`
  );
  const deleted_attractions = await db.delete(schema.attractions).where(
    gt(schema.attractions.id, 3)
  );
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

function copyImages(localDir: string, prefix: string): string[] {
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "xhs");
  fs.mkdirSync(uploadsDir, { recursive: true });

  const urls: string[] = [];
  if (!fs.existsSync(localDir)) return urls;

  const files = fs.readdirSync(localDir).filter((f) => f.endsWith(".jpg"));
  for (const file of files) {
    const src = path.join(localDir, file);
    const safeName = prefix.replace(/[^a-zA-Z0-9一-鿿]/g, "_").slice(0, 30);
    const destName = `${safeName}_${Date.now()}_${file}`;
    const dest = path.join(uploadsDir, destName);
    fs.copyFileSync(src, dest);
    urls.push(`/uploads/xhs/${destName}`);
  }
  return urls;
}

async function importAttraction(item: ProcessedAttraction) {
  const cityId = cityCache.get(item.cityName);
  if (!cityId) {
    console.log(`  Skip: city "${item.cityName}" not found`);
    return;
  }

  const spotImages: string[][] = [];
  for (const spot of item.spots) {
    const imgs = copyImages(spot.localDir, spot.name);
    spotImages.push(imgs);
  }

  const allImages = spotImages.flat();
  const coverImage = allImages[0] || null;

  const [attraction] = await db.insert(schema.attractions).values({
    cityId,
    name: item.attractionName,
    description: item.description,
    coverImage,
    latitude: String(item.latitude),
    longitude: String(item.longitude),
    hotScore: item.hotScore,
    spotsCount: item.spots.length,
    isPublished: true,
  }).returning();

  for (let si = 0; si < item.spots.length; si++) {
    const spot = item.spots[si];
    const imgs = spotImages[si];
    const spotCover = imgs[0] || null;

    const [created] = await db.insert(schema.spots).values({
      attractionId: attraction.id,
      name: spot.name,
      description: spot.description,
      coverImage: spotCover,
      latitude: String(item.latitude + (Math.random() - 0.5) * 0.002),
      longitude: String(item.longitude + (Math.random() - 0.5) * 0.002),
      compositionTips: spot.compositionTips || null,
      outfitTips: spot.outfitTips || null,
      photoTips: spot.photoTips || null,
      difficulty: "easy",
      isPublished: true,
    }).returning();

    for (let i = 0; i < imgs.length; i++) {
      await db.insert(schema.photos).values({
        spotId: created.id,
        attractionId: attraction.id,
        cityId,
        url: imgs[i],
        alt: `${spot.name} - ${i + 1}`,
        sourcePlatform: "xhs",
        sourceUrl: spot.sourceUrl || null,
        sortOrder: i,
      });
    }
  }

  console.log(`  Imported: ${item.attractionName} (${item.spots.length} spots, ${allImages.length} photos)`);
}

async function main() {
  const dataPath = path.join(__dirname, "xhs", "data", "cleaned_data.json");
  if (!fs.existsSync(dataPath)) {
    console.error("cleaned_data.json not found. Run clean_data.py first.");
    process.exit(1);
  }

  const data: ProcessedAttraction[] = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  console.log(`Loaded ${data.length} attractions`);

  await loadCities();
  await cleanAllXhsData();

  let imported = 0;
  for (const item of data) {
    try {
      await importAttraction(item);
      imported++;
    } catch (err) {
      console.error(`  Error: ${item.attractionName}: ${err}`);
    }
  }

  console.log(`\nDone: ${imported} attractions imported`);
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
