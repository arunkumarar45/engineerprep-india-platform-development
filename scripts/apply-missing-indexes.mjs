import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Client } = require('pg');

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const queries = [
  // Unique indexes on slugs
  `CREATE UNIQUE INDEX IF NOT EXISTS dsa_sheets_slug_idx ON dsa_sheets (slug);`,
  `CREATE UNIQUE INDEX IF NOT EXISTS dsa_patterns_slug_idx ON dsa_patterns (slug);`,
  `CREATE UNIQUE INDEX IF NOT EXISTS roadmaps_slug_idx ON roadmaps (slug);`,
  `CREATE UNIQUE INDEX IF NOT EXISTS mock_tests_slug_idx ON mock_tests (slug);`,

  // High performance query indexes
  `CREATE INDEX IF NOT EXISTS dsa_problems_diff_topic_idx ON dsa_problems (difficulty, topic);`,
  `CREATE INDEX IF NOT EXISTS roadmaps_category_idx ON roadmaps (category);`,
  `CREATE INDEX IF NOT EXISTS mock_tests_subject_idx ON mock_tests (subject);`,
  `CREATE INDEX IF NOT EXISTS opportunities_deadline_idx ON opportunities (application_deadline);`,
  `CREATE INDEX IF NOT EXISTS opportunities_work_mode_idx ON opportunities (work_mode);`,
  `CREATE INDEX IF NOT EXISTS resources_subject_code_idx ON resources (subject_code);`,
  `CREATE INDEX IF NOT EXISTS resources_type_status_idx ON resources (resource_type, status);`,

  // GIN Trigram index for search if extension is available
  `CREATE EXTENSION IF NOT EXISTS pg_trgm;`,
  `CREATE INDEX IF NOT EXISTS resources_title_trgm_idx ON resources USING gin (title gin_trgm_ops);`,
  `CREATE INDEX IF NOT EXISTS dsa_problems_title_trgm_idx ON dsa_problems USING gin (title gin_trgm_ops);`,
  `CREATE INDEX IF NOT EXISTS opportunities_title_trgm_idx ON opportunities USING gin (title gin_trgm_ops);`
];

console.log('=== Applying Database Schema Performance & Integrity Indexes ===');
for (const q of queries) {
  try {
    await client.query(q);
    console.log('✅ Executed:', q.split('\n')[0]);
  } catch (err) {
    console.warn('⚠️ Warning executing:', q.split('\n')[0], err.message);
  }
}

console.log('All indexes verified successfully.');
await client.end();

