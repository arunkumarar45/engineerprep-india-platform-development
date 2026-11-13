import pg from "pg";
const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:Arun%40018@127.0.0.1:5432/engineerprep_db",
});

async function main() {
  await client.connect();

  const typeCounts = await client.query(`
    SELECT resource_type, count(*)::int as count
    FROM resources
    GROUP BY resource_type
    ORDER BY count DESC
  `);
  console.log("Current resource types in database:");
  console.table(typeCounts.rows);

  const impQuestions = await client.query(`
    SELECT count(*)::int as count
    FROM resources
    WHERE title ILIKE '%important%' OR title ILIKE '%passing%'
  `);
  console.log("Important/passing framed questions count:", impQuestions.rows[0].count);

  const labManuals = await client.query(`
    SELECT count(*)::int as count
    FROM resources
    WHERE resource_type = 'LAB_MANUAL'
  `);
  console.log("LAB_MANUAL records count:", labManuals.rows[0].count);

  const total = await client.query(`SELECT count(*)::int as count FROM resources`);
  console.log("Total authentic resources remaining:", total.rows[0].count);

  const googleCol = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'google_id'
  `);
  console.log("google_id column in users table:", googleCol.rows);

  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
