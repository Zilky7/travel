const postgres = require("postgres");
const fs = require("fs");
const path = require("path");

async function main() {
  const client = postgres(process.env.DATABASE_URL);

  // 1. Merge duplicate cities
  const dupes = await client`
    SELECT name, array_agg(id ORDER BY id) as ids FROM cities GROUP BY name HAVING count(*) > 1
  `;
  for (const d of dupes) {
    const keep = d.ids[0];
    for (let i = 1; i < d.ids.length; i++) {
      await client`UPDATE attractions SET city_id = ${keep} WHERE city_id = ${d.ids[i]}`;
      await client`DELETE FROM cities WHERE id = ${d.ids[i]}`;
    }
  }
  console.log("Merged " + dupes.length + " duplicate cities");

  // 2. Delete photos where file doesn't exist
  const allPhotos = await client`SELECT id, url FROM photos`;
  let deleted = 0;
  for (const p of allPhotos) {
    const filePath = path.join("/app/public", p.url);
    if (!fs.existsSync(filePath)) {
      await client`DELETE FROM photos WHERE id = ${p.id}`;
      deleted++;
    }
  }
  console.log("Deleted " + deleted + " orphan photo records");

  // 3. Delete spots without photos
  const emptySpots = await client`
    SELECT s.id, s.name FROM spots s LEFT JOIN photos p ON p.spot_id = s.id WHERE p.id IS NULL
  `;
  for (const s of emptySpots) {
    await client`DELETE FROM spots WHERE id = ${s.id}`;
  }
  console.log("Deleted " + emptySpots.length + " empty spots");

  // 4. Delete attractions with 0 spots
  const emptyAttr = await client`
    SELECT a.id, a.name FROM attractions a
    LEFT JOIN spots s ON s.attraction_id = a.id
    WHERE s.id IS NULL
  `;
  for (const a of emptyAttr) {
    await client`DELETE FROM attractions WHERE id = ${a.id}`;
  }
  console.log("Deleted " + emptyAttr.length + " empty attractions");

  // 5. Fix spots_count
  await client`UPDATE attractions SET spots_count = (SELECT count(*) FROM spots WHERE spots.attraction_id = attractions.id)`;

  // 6. Fix attraction covers
  const noCover = await client`SELECT id FROM attractions WHERE cover_image IS NULL`;
  let fixed = 0;
  for (const a of noCover) {
    const sp = await client`SELECT cover_image FROM spots WHERE attraction_id = ${a.id} AND cover_image IS NOT NULL LIMIT 1`;
    if (sp.length > 0) {
      await client`UPDATE attractions SET cover_image = ${sp[0].cover_image} WHERE id = ${a.id}`;
      fixed++;
    }
  }
  console.log("Fixed " + fixed + " attraction covers");

  // Final stats
  const stats = await client`
    SELECT
      (SELECT count(*) FROM cities) as cities,
      (SELECT count(*) FROM attractions) as attractions,
      (SELECT count(*) FROM spots) as spots,
      (SELECT count(*) FROM photos) as photos
  `;
  const s = stats[0];
  console.log("\nFINAL: " + s.cities + " cities, " + s.attractions + " attractions, " + s.spots + " spots, " + s.photos + " photos");

  await client.end();
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
