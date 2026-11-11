import "dotenv/config";
import { db } from "../src/db";
import { resources } from "../src/db/schema";
import { sql } from "drizzle-orm";

async function main() {
  console.log("🔄 Updating all broken Google Drive URLs to internal verified document viewer...");

  // Update any resources with the broken Google Drive IDs
  const result = await db.execute(sql`
    UPDATE resources
    SET file_url = '/vtu/view/' || id
    WHERE file_url LIKE '%1L9X8902rWpGxnCAPGqfIOiQ-qKz445VW%'
       OR file_url LIKE '%1P5Y7912rWpGxnCAPGqfIOiQ-qKz667YZ%'
       OR file_url LIKE '%1M3Z9914rWpGxnCAPGqfIOiQ-qKz778AB%'
       OR file_url LIKE '%1XpY3Q9k9O1Q6Y3K8qK2vX0w1xY_4l8X9%'
  `);

  console.log("Updated broken resource links:", result);

  // Also specifically ensure ALL SYLLABUS resources use the dedicated /vtu/view/ URL
  const sylResult = await db.execute(sql`
    UPDATE resources
    SET file_url = '/vtu/view/' || id
    WHERE resource_type = 'SYLLABUS'
  `);
  console.log("Updated syllabus links to official viewer:", sylResult);

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

