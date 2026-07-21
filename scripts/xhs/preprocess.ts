import * as fs from "fs";
import * as path from "path";

const DATA_DIR = path.join(__dirname, "data");

interface RawSpot {
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

interface RawAttraction {
  cityName: string;
  attractionName: string;
  description: string;
  coverImage: string;
  latitude: number;
  longitude: number;
  hotScore: number;
  spots: RawSpot[];
}

interface PostClassification {
  index: number;
  type: "A" | "B" | "C";
  spotName?: string;
  reason: string;
}

interface ReclassifyEntry {
  toAttraction: string;
  reason: string;
}

interface MappingFile {
  classifications: Record<string, PostClassification[]>;
  postReclassify?: Record<string, ReclassifyEntry>;
  attractionRenames?: Record<string, { newName: string; note?: string }>;
}

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

function filterExistingImages(images: string[], localDir: string): string[] {
  return images.filter((img) => {
    const imgPath = path.join(localDir, img);
    return fs.existsSync(imgPath);
  });
}

function cleanDescription(desc: string): string {
  let cleaned = desc
    .replace(/#[^\[]*?\[话题\]#\s*/g, "")
    .replace(/@\S+/g, "")
    .replace(/\[.*?R\]/g, "")
    .trim();
  const lines = cleaned.split("\n").filter((l) => l.trim());
  return lines.join("\n");
}

function loadMappings(): MappingFile {
  const combined: MappingFile = {
    classifications: {},
    postReclassify: {},
    attractionRenames: {},
  };

  const files = ["shanghai_mapping.json", "other_cities_mapping.json"];
  for (const f of files) {
    const fp = path.join(DATA_DIR, f);
    if (!fs.existsSync(fp)) {
      console.warn(`Warning: ${f} not found, skipping`);
      continue;
    }
    const data: MappingFile = JSON.parse(fs.readFileSync(fp, "utf-8"));
    Object.assign(combined.classifications, data.classifications || {});
    Object.assign(combined.postReclassify!, data.postReclassify || {});
    Object.assign(combined.attractionRenames!, data.attractionRenames || {});
  }

  return combined;
}

function getClassification(
  mapping: MappingFile,
  city: string,
  attraction: string,
  index: number
): PostClassification | null {
  const key = `${city}/${attraction}`;
  const posts = mapping.classifications[key];
  if (!posts) return null;
  return posts.find((p) => p.index === index) || null;
}

function getReclassify(
  mapping: MappingFile,
  city: string,
  attraction: string,
  index: number
): string | null {
  const key = `${city}/${attraction}/${index}`;
  const entry = mapping.postReclassify?.[key];
  return entry?.toAttraction || null;
}

function getAttractionRename(
  mapping: MappingFile,
  city: string,
  attraction: string
): string | null {
  const key = `${city}/${attraction}`;
  const entry = mapping.attractionRenames?.[key];
  return entry?.newName || null;
}

// Published cities list
const PUBLISHED_CITIES = new Set(["上海"]);

function main() {
  const rawPath = path.join(DATA_DIR, "cleaned_data.json");
  const raw: RawAttraction[] = JSON.parse(fs.readFileSync(rawPath, "utf-8"));
  console.log(`Loaded ${raw.length} raw attractions`);

  const mapping = loadMappings();

  // Step 1: Collect all posts, apply reclassifications
  // key: "city/attraction" -> posts with their classification
  const postsByAttraction = new Map<
    string,
    { post: RawSpot; classification: PostClassification; rawAttraction: RawAttraction }[]
  >();

  // Initialize all attractions from raw data
  const attractionMeta = new Map<
    string,
    { city: string; name: string; desc: string; lat: number; lng: number; hotScore: number }
  >();

  for (const attr of raw) {
    const city = attr.cityName;
    const name = getAttractionRename(mapping, city, attr.attractionName) || attr.attractionName;
    const key = `${city}/${name}`;

    if (!attractionMeta.has(key)) {
      attractionMeta.set(key, {
        city,
        name,
        desc: cleanDescription(attr.description),
        lat: attr.latitude,
        lng: attr.longitude,
        hotScore: attr.hotScore,
      });
    }

    if (!postsByAttraction.has(key)) {
      postsByAttraction.set(key, []);
    }

    for (let i = 0; i < attr.spots.length; i++) {
      const post = attr.spots[i];
      const reclassTo = getReclassify(mapping, city, attr.attractionName, i);
      const targetKey = reclassTo ? `${city}/${reclassTo}` : key;

      // Ensure target attraction exists in meta
      if (reclassTo && !attractionMeta.has(targetKey)) {
        attractionMeta.set(targetKey, {
          city,
          name: reclassTo,
          desc: "",
          lat: attr.latitude,
          lng: attr.longitude,
          hotScore: 0,
        });
      }
      if (!postsByAttraction.has(targetKey)) {
        postsByAttraction.set(targetKey, []);
      }

      const cls = getClassification(mapping, city, attr.attractionName, i);
      const defaultCls: PostClassification = { index: i, type: "B", reason: "no mapping, default to B" };

      postsByAttraction.get(targetKey)!.push({
        post,
        classification: cls || defaultCls,
        rawAttraction: attr,
      });
    }
  }

  // Step 2: Build clean output
  const output: CleanAttraction[] = [];

  for (const [key, posts] of postsByAttraction) {
    const meta = attractionMeta.get(key)!;

    const cleanAttr: CleanAttraction = {
      cityName: meta.city,
      name: meta.name,
      description: meta.desc,
      latitude: meta.lat,
      longitude: meta.lng,
      hotScore: meta.hotScore,
      isPublished: PUBLISHED_CITIES.has(meta.city),
      spots: [],
      attractionPhotos: [],
    };

    // Merge Type A posts by spotName
    const spotMap = new Map<string, CleanSpot>();

    for (const { post, classification } of posts) {
      if (classification.type === "C") continue;

      const validImages = filterExistingImages(post.images, post.localDir);
      if (validImages.length === 0) continue;

      if (classification.type === "A" && classification.spotName) {
        const spotName = classification.spotName;
        if (!spotMap.has(spotName)) {
          spotMap.set(spotName, {
            name: spotName,
            description: cleanDescription(post.description),
            imageGroups: [{ localDir: post.localDir, images: validImages }],
            sourceUrl: post.sourceUrl,
            likedCount: post.likedCount,
          });
        } else {
          const existing = spotMap.get(spotName)!;
          existing.imageGroups.push({ localDir: post.localDir, images: validImages });
          const existingLikes = parseLikes(existing.likedCount);
          const newLikes = parseLikes(post.likedCount);
          if (newLikes > existingLikes) {
            existing.description = cleanDescription(post.description);
            existing.likedCount = post.likedCount;
          }
        }
      } else if (classification.type === "B") {
        cleanAttr.attractionPhotos.push({
          images: validImages,
          sourceUrl: post.sourceUrl,
          localDir: post.localDir,
          originalTitle: post.name,
        });
      }
    }

    cleanAttr.spots = Array.from(spotMap.values());

    // Recalculate hotScore: sum of all posts' likes
    let totalHot = 0;
    for (const { post } of posts) {
      totalHot += parseLikes(post.likedCount);
    }
    cleanAttr.hotScore = totalHot;

    // Skip attractions with no content
    if (cleanAttr.spots.length === 0 && cleanAttr.attractionPhotos.length === 0) {
      console.log(`Skip empty: ${key}`);
      continue;
    }

    output.push(cleanAttr);
  }

  // Sort by hotScore
  output.sort((a, b) => b.hotScore - a.hotScore);

  const outPath = path.join(DATA_DIR, "final_clean_data.json");
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), "utf-8");

  // Print summary
  console.log("\n=== Preprocessing Summary ===");
  console.log(`Total attractions: ${output.length}`);
  let totalSpots = 0;
  let totalAttrPhotos = 0;
  let totalImages = 0;
  for (const a of output) {
    totalSpots += a.spots.length;
    totalAttrPhotos += a.attractionPhotos.length;
    for (const s of a.spots) totalImages += s.imageGroups.reduce((sum, g) => sum + g.images.length, 0);
    for (const p of a.attractionPhotos) totalImages += p.images.length;
    const published = a.isPublished ? "PUBLISHED" : "hidden";
    console.log(
      `  ${a.cityName}/${a.name}: ${a.spots.length} spots, ${a.attractionPhotos.length} attraction-photo-groups [${published}]`
    );
  }
  console.log(`Total spots (real): ${totalSpots}`);
  console.log(`Total attraction-level photo groups: ${totalAttrPhotos}`);
  console.log(`Total image refs: ${totalImages}`);
  console.log(`Output: ${outPath}`);
}

function parseLikes(s: string): number {
  if (!s) return 0;
  s = s.trim();
  if (s.endsWith("万")) {
    return parseFloat(s.replace("万", "")) * 10000;
  }
  return parseInt(s.replace(/,/g, ""), 10) || 0;
}

main();
