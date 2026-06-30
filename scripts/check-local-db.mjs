import mysql from "mysql2/promise";

const LOCAL_URL = "mysql://root:@localhost:3306/nagpur_civic";

const conn = await mysql.createConnection(LOCAL_URL);
const [tables] = await conn.query("SHOW TABLES");
console.log("Tables:", tables);

for (const row of tables) {
  const name = Object.values(row)[0];
  const [count] = await conn.query(`SELECT COUNT(*) AS n FROM \`${name}\``);
  console.log(`  ${name}: ${count[0].n}`);
}
await conn.end();
