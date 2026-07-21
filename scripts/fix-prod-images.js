const fs = require("fs");
const postgres = require("postgres");

async function main() {
  const client = postgres(process.env.DATABASE_URL);

  const imgDir = "/app/public/uploads/xhs";
  const files = fs.readdirSync(imgDir).sort();

  // group files by name prefix (before timestamp)
  const groups = {};
  files.forEach((f) => {
    const parts = f.split("_");
    const tsIdx = parts.findIndex((p) => /^17779\d+$/.test(p));
    if (tsIdx > 0) {
      const prefix = parts.slice(0, tsIdx).join("_");
      if (!groups[prefix]) groups[prefix] = [];
      groups[prefix].push(f);
    }
  });

  // get ALL spots (not just those without cover)
  const spots = await client`SELECT id, name FROM spots`;
  console.log(`Total spots: ${spots.length}, Image groups: ${Object.keys(groups).length}`);

  let updated = 0;
  for (const spot of spots) {
    const safeName = spot.name.replace(/[^a-zA-Z0-9一-鿿]/g, "_").slice(0, 30);
    const matching = groups[safeName];
    if (!matching || matching.length === 0) continue;

    // set cover image
    const cover = "/uploads/xhs/" + matching[0];
    await client`UPDATE spots SET cover_image = ${cover} WHERE id = ${spot.id}`;

    // check if photos already exist for this spot
    const existing = await client`SELECT count(*) as cnt FROM photos WHERE spot_id = ${spot.id}`;
    if (parseInt(existing[0].cnt) > 0) continue;

    // create photo records
    for (let i = 0; i < matching.length; i++) {
      const url = "/uploads/xhs/" + matching[i];
      const alt = spot.name + " - " + (i + 1);
      await client`INSERT INTO photos (spot_id, url, alt, sort_order, created_at) VALUES (${spot.id}, ${url}, ${alt}, ${i}, NOW())`;
    }
    updated++;
  }

  const photoCount = await client`SELECT count(*) as cnt FROM photos`;
  console.log(`Updated ${updated} spots. Total photos now: ${photoCount[0].cnt}`);
  await client.end();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
