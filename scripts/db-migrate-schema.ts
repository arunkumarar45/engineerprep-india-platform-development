import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");
import "dotenv/config";
import { db } from "../src/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Checking and applying schema updates...");

  // 1. Add missing columns to resources table if not exist
  await db.execute(sql`
    ALTER TABLE resources 
    ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES branches(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS scheme_id uuid REFERENCES schemes(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS semester_id uuid REFERENCES semesters(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS subject_code varchar(40),
    ADD COLUMN IF NOT EXISTS exam_year integer,
    ADD COLUMN IF NOT EXISTS exam_month varchar(30),
    ADD COLUMN IF NOT EXISTS exam_type varchar(40),
    ADD COLUMN IF NOT EXISTS source_website varchar(120),
    ADD COLUMN IF NOT EXISTS source_page_url text,
    ADD COLUMN IF NOT EXISTS original_file_url text,
    ADD COLUMN IF NOT EXISTS file_hash varchar(64),
    ADD COLUMN IF NOT EXISTS mime_type varchar(80) DEFAULT 'application/pdf',
    ADD COLUMN IF NOT EXISTS download_status varchar(40) DEFAULT 'COMPLETED',
    ADD COLUMN IF NOT EXISTS verification_status varchar(40) DEFAULT 'VERIFIED';
  `);
  console.log("resources columns verified.");

  // 2. Create indices on resources
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS resources_branch_idx ON resources (branch_id);
    CREATE INDEX IF NOT EXISTS resources_scheme_idx ON resources (scheme_id);
    CREATE INDEX IF NOT EXISTS resources_semester_idx ON resources (semester_id);
    CREATE INDEX IF NOT EXISTS resources_file_hash_idx ON resources (file_hash);
  `);
  console.log("resources indices verified.");

  // 3. Create vtu_discovered_resources table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS vtu_discovered_resources (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      category resource_type NOT NULL DEFAULT 'QUESTION_PAPER',
      title varchar(300) NOT NULL,
      subject_code varchar(40),
      subject_name varchar(260),
      branch_code varchar(40),
      branch_id uuid REFERENCES branches(id) ON DELETE SET NULL,
      scheme_name varchar(60),
      scheme_id uuid REFERENCES schemes(id) ON DELETE SET NULL,
      semester_number integer,
      semester_id uuid REFERENCES semesters(id) ON DELETE SET NULL,
      exam_year integer,
      exam_month varchar(30),
      exam_type varchar(40),
      module_number integer,
      source_website varchar(120) NOT NULL,
      source_page_url text,
      original_file_url text NOT NULL,
      stored_file_path text,
      file_size varchar(40) DEFAULT '—',
      file_hash varchar(64),
      mime_type varchar(80) DEFAULT 'application/pdf',
      download_status varchar(40) NOT NULL DEFAULT 'DISCOVERED',
      validation_status varchar(40) NOT NULL DEFAULT 'PENDING',
      validation_notes text,
      approval_status varchar(40) NOT NULL DEFAULT 'PENDING_REVIEW',
      is_uploaded boolean NOT NULL DEFAULT false,
      uploaded_resource_id uuid REFERENCES resources(id) ON DELETE SET NULL,
      error_log text,
      created_at timestamp with time zone NOT NULL DEFAULT now(),
      updated_at timestamp with time zone NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS vtu_discovered_category_idx ON vtu_discovered_resources (category);
    CREATE INDEX IF NOT EXISTS vtu_discovered_source_idx ON vtu_discovered_resources (source_website);
    CREATE INDEX IF NOT EXISTS vtu_discovered_approval_idx ON vtu_discovered_resources (approval_status);
    CREATE INDEX IF NOT EXISTS vtu_discovered_download_status_idx ON vtu_discovered_resources (download_status);
    CREATE INDEX IF NOT EXISTS vtu_discovered_validation_status_idx ON vtu_discovered_resources (validation_status);
    CREATE INDEX IF NOT EXISTS vtu_discovered_hash_idx ON vtu_discovered_resources (file_hash);
    CREATE INDEX IF NOT EXISTS vtu_discovered_orig_url_idx ON vtu_discovered_resources (original_file_url);
  `);
  console.log("vtu_discovered_resources table & indices verified.");

  // 4. Create vtu_collection_jobs table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS vtu_collection_jobs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      job_type varchar(40) NOT NULL,
      category resource_type,
      source_website varchar(120),
      status varchar(40) NOT NULL DEFAULT 'QUEUED',
      progress integer NOT NULL DEFAULT 0,
      total_items integer NOT NULL DEFAULT 0,
      processed_items integer NOT NULL DEFAULT 0,
      success_count integer NOT NULL DEFAULT 0,
      failed_count integer NOT NULL DEFAULT 0,
      filters jsonb DEFAULT '{}'::jsonb,
      result jsonb DEFAULT '{}'::jsonb,
      error_message text,
      started_at timestamp with time zone,
      finished_at timestamp with time zone,
      created_at timestamp with time zone NOT NULL DEFAULT now(),
      updated_at timestamp with time zone NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS vtu_jobs_status_idx ON vtu_collection_jobs (status);
    CREATE INDEX IF NOT EXISTS vtu_jobs_type_idx ON vtu_collection_jobs (job_type);
    CREATE INDEX IF NOT EXISTS vtu_jobs_created_idx ON vtu_collection_jobs (created_at);
  `);
  console.log("vtu_collection_jobs table & indices verified.");

  // 5. Let's inspect counts
  const resCount = await db.execute(sql`SELECT count(*) FROM resources;`);
  const notesCount = await db.execute(sql`SELECT count(*) FROM resources WHERE resource_type = 'NOTES';`);
  const qpCount = await db.execute(sql`SELECT count(*) FROM resources WHERE resource_type = 'QUESTION_PAPER';`);
  const sylCount = await db.execute(sql`SELECT count(*) FROM resources WHERE resource_type = 'SYLLABUS';`);
  const labCount = await db.execute(sql`SELECT count(*) FROM resources WHERE resource_type = 'LAB_MANUAL';`);
  const assignCount = await db.execute(sql`SELECT count(*) FROM resources WHERE resource_type = 'ASSIGNMENT';`);

  console.log("\n--- Current Resource Counts in Database ---");
  console.log(`Total Resources: ${resCount.rows[0].count}`);
  console.log(`NOTES (Must remain strictly untouched): ${notesCount.rows[0].count}`);
  console.log(`QUESTION_PAPER: ${qpCount.rows[0].count}`);
  console.log(`SYLLABUS: ${sylCount.rows[0].count}`);
  console.log(`LAB_MANUAL: ${labCount.rows[0].count}`);
  console.log(`ASSIGNMENT: ${assignCount.rows[0].count}`);
  
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
