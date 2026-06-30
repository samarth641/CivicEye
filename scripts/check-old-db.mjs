import pg from "pg";

const OLD_PG_URL =
  "postgresql://postgres:rupflNlpxTSbdXPsvjSBNHtgXTaYdVcJ@mainline.proxy.rlwy.net:32596/railway";

const client = new pg.Client({
  connectionString: OLD_PG_URL,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
const tables = await client.query(
  `SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY 1`
);
console.log("Tables:", tables.rows.map((r) => r.table_name));

for (const { table_name } of tables.rows) {
  const count = await client.query(`SELECT COUNT(*)::int AS n FROM "${table_name}"`);
  console.log(`  ${table_name}: ${count.rows[0].n}`);
}
await client.end();
