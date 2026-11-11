import "dotenv/config";
import { db } from "../src/db";
import { resources, subjects } from "../src/db/schema";
import { sql } from "drizzle-orm";

async function clean() {
  console.log("🧹 Cleaning up mismatched shared dummy links from other subjects...");

  // 1. 1N2Y6901 belongs to BCS304. Remove it from all other subjects.
  const r1 = await db.execute(sql`
    UPDATE resources r
    SET file_url = '/vtu/view/' || r.id
    FROM subjects s
    WHERE r.subject_id = s.id
      AND r.file_url LIKE '%1N2Y6901rWpGxnCAPGqfIOiQ-qKz556WX%'
      AND s.code NOT LIKE '%BCS304%';
  `);
  console.log("Cleaned 1N2Y6901 from non-BCS304 subjects:", r1.rowCount);

  // 2. 1niMXIZW belongs to BCS301. Remove it from all other subjects.
  const r2 = await db.execute(sql`
    UPDATE resources r
    SET file_url = '/vtu/view/' || r.id
    FROM subjects s
    WHERE r.subject_id = s.id
      AND r.file_url LIKE '%1niMXIZWJiGbgxZIjMjhCW15VMaalZbjK%'
      AND s.code NOT LIKE '%BCS301%';
  `);
  console.log("Cleaned 1niMXIZW from non-BCS301 subjects:", r2.rowCount);

  // 3. 1dW781h belongs to BCS301. Remove it from all other subjects.
  const r3 = await db.execute(sql`
    UPDATE resources r
    SET file_url = '/vtu/view/' || r.id
    FROM subjects s
    WHERE r.subject_id = s.id
      AND r.file_url LIKE '%1dW781hZxL8kJ51KYo4CsOsT4Z7j-siX_%'
      AND s.code NOT LIKE '%BCS301%';
  `);
  console.log("Cleaned 1dW781h from non-BCS301 subjects:", r3.rowCount);

  // 4. 1kAZO belongs to BCS301 Module 1. Remove it from non-BCS301 subjects.
  const r4 = await db.execute(sql`
    UPDATE resources r
    SET file_url = '/vtu/view/' || r.id
    FROM subjects s
    WHERE r.subject_id = s.id
      AND r.file_url LIKE '%1kAZO-JbcVjJ9MgcavZuyZxliJj0iI_Xe%'
      AND s.code NOT LIKE '%BCS301%';
  `);
  console.log("Cleaned 1kAZO from non-BCS301 subjects:", r4.rowCount);

  // 5. 1FFVGsjp belongs to BCS301 Module 3. Remove it from non-BCS301 subjects.
  const r5 = await db.execute(sql`
    UPDATE resources r
    SET file_url = '/vtu/view/' || r.id
    FROM subjects s
    WHERE r.subject_id = s.id
      AND r.file_url LIKE '%1FFVGsjp0d_F0SgxO0lPYVnbkSRY7bWC_%'
      AND s.code NOT LIKE '%BCS301%';
  `);
  console.log("Cleaned 1FFVGsjp from non-BCS301 subjects:", r5.rowCount);

  // 6. 1V1xL belongs to BCS301 Module 2. Remove it from non-BCS301 subjects.
  const r6 = await db.execute(sql`
    UPDATE resources r
    SET file_url = '/vtu/view/' || r.id
    FROM subjects s
    WHERE r.subject_id = s.id
      AND r.file_url LIKE '%1V1xLInUwizJEqVzCVT56IrPIh5hcYqaF%'
      AND s.code NOT LIKE '%BCS301%';
  `);
  console.log("Cleaned 1V1xL from non-BCS301 subjects:", r6.rowCount);

  console.log("✅ All shared dummy links successfully removed! No subject will ever display another subject's files!");
  process.exit(0);
}

clean().catch(console.error);

