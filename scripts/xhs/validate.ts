import * as fs from "fs";
import * as path from "path";

const DATA_DIR = path.join(__dirname, "data");

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

function main() {
  const dataPath = path.join(DATA_DIR, "final_clean_data.json");
  const data: CleanAttraction[] = JSON.parse(
    fs.readFileSync(dataPath, "utf-8")
  );

  let errors = 0;
  let warnings = 0;
  let totalImages = 0;
  let missingImages = 0;

  for (const attr of data) {
    // Check: attraction has lat/lng
    if (!attr.latitude || !attr.longitude) {
      console.error(`ERROR: ${attr.cityName}/${attr.name} missing lat/lng`);
      errors++;
    }

    // Check: attraction has content
    if (attr.spots.length === 0 && attr.attractionPhotos.length === 0) {
      console.error(
        `ERROR: ${attr.cityName}/${attr.name} has no spots and no photos`
      );
      errors++;
    }

    // Check spots
    for (const spot of attr.spots) {
      if (!spot.name || spot.name.length < 2) {
        console.error(
          `ERROR: ${attr.cityName}/${attr.name} has spot with bad name: "${spot.name}"`
        );
        errors++;
      }

      const totalSpotImages = spot.imageGroups.reduce((s, g) => s + g.images.length, 0);
      if (totalSpotImages === 0) {
        console.error(
          `ERROR: ${attr.cityName}/${attr.name}/${spot.name} has no images`
        );
        errors++;
      }

      for (const group of spot.imageGroups) {
        for (const img of group.images) {
          totalImages++;
          const imgPath = path.join(group.localDir, img);
          if (!fs.existsSync(imgPath)) {
            console.error(`ERROR: Missing image: ${imgPath}`);
            missingImages++;
            errors++;
          }
        }
      }

      // Warn: spot name looks like post title (too long)
      if (spot.name.length > 20) {
        console.warn(
          `WARN: ${attr.cityName}/${attr.name} spot name may be too long: "${spot.name}"`
        );
        warnings++;
      }
    }

    // Check attraction photos
    for (const group of attr.attractionPhotos) {
      if (group.images.length === 0) {
        console.warn(
          `WARN: ${attr.cityName}/${attr.name} has empty photo group`
        );
        warnings++;
      }

      for (const img of group.images) {
        totalImages++;
        const imgPath = path.join(group.localDir, img);
        if (!fs.existsSync(imgPath)) {
          console.error(`ERROR: Missing image: ${imgPath}`);
          missingImages++;
          errors++;
        }
      }
    }
  }

  // Check for duplicate spot names within same attraction
  for (const attr of data) {
    const seen = new Set<string>();
    for (const spot of attr.spots) {
      if (seen.has(spot.name)) {
        console.warn(
          `WARN: Duplicate spot name in ${attr.cityName}/${attr.name}: "${spot.name}"`
        );
        warnings++;
      }
      seen.add(spot.name);
    }
  }

  // Summary by city
  console.log("\n=== Per-city Summary ===");
  const cityStats = new Map<
    string,
    { attractions: number; spots: number; photos: number; published: boolean }
  >();
  for (const attr of data) {
    if (!cityStats.has(attr.cityName)) {
      cityStats.set(attr.cityName, {
        attractions: 0,
        spots: 0,
        photos: 0,
        published: attr.isPublished,
      });
    }
    const cs = cityStats.get(attr.cityName)!;
    cs.attractions++;
    cs.spots += attr.spots.length;
    cs.photos +=
      attr.spots.reduce((s, sp) => s + sp.imageGroups.reduce((gs, g) => gs + g.images.length, 0), 0) +
      attr.attractionPhotos.reduce((s, g) => s + g.images.length, 0);
  }
  for (const [city, stats] of cityStats) {
    const pub = stats.published ? "PUBLISHED" : "hidden";
    console.log(
      `  ${city}: ${stats.attractions} attractions, ${stats.spots} spots, ${stats.photos} photos [${pub}]`
    );
  }

  console.log(`\n=== Validation Result ===`);
  console.log(`Total images checked: ${totalImages}`);
  console.log(`Missing images: ${missingImages}`);
  console.log(`Errors: ${errors}`);
  console.log(`Warnings: ${warnings}`);
  console.log(errors === 0 ? "PASSED" : "FAILED");
}

main();
