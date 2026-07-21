const postgres = require("postgres");
const fs = require("fs");

async function main() {
  const client = postgres(process.env.DATABASE_URL);
  const files = fs.readdirSync("/app/public/uploads/xhs/").sort();
  const nocover = await client`SELECT id, name FROM attractions WHERE cover_image IS NULL`;
  let updated = 0;

  for (const a of nocover) {
    const prefix = a.name.replace(/[^a-zA-Z0-9一-鿿]/g, "_").slice(0, 15);
    const match = files.find((f) => f.includes(prefix));
    if (match) {
      const url = "/uploads/xhs/" + match;
      await client`UPDATE attractions SET cover_image = ${url} WHERE id = ${a.id}`;
      updated++;
    } else {
      const anyPhoto = await client`SELECT url FROM photos WHERE attraction_id = ${a.id} LIMIT 1`;
      if (anyPhoto.length > 0) {
        await client`UPDATE attractions SET cover_image = ${anyPhoto[0].url} WHERE id = ${a.id}`;
        updated++;
      }
    }
  }
  console.log(`Fixed ${updated} more attraction covers. Remaining without: ${nocover.length - updated}`);
  await client.end();
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
