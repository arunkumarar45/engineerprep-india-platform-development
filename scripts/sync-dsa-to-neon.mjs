import dns from 'node:dns/promises';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import { Client } from 'pg';

async function main() {
  console.log('Resolving Neon host IP via DNS 8.8.8.8...');
  const neonHost = 'ep-restless-lab-b3mahzws-pooler.c-4.ap-southeast-1.aws.neon.tech';
  const ips = await dns.resolve4(neonHost);

  const local = new Client({
    connectionString: 'postgresql://postgres:Arun%40018@127.0.0.1:5432/engineerprep_db'
  });

  const neon = new Client({
    host: ips[0],
    port: 5432,
    user: 'neondb_owner',
    password: 'npg_HsQcpjaRIo48',
    database: 'neondb',
    ssl: { rejectUnauthorized: false, servername: neonHost }
  });

  await local.connect();
  await neon.connect();
  console.log('Connected to both databases.');

  // 1. Sync DSA Patterns
  console.log('\n--- Syncing DSA Patterns ---');
  const patterns = await local.query('SELECT * FROM dsa_patterns');
  for (const p of patterns.rows) {
    await neon.query(
      `INSERT INTO dsa_patterns (id, name, slug, summary, about, when_to_use, templates, icon, tint)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (slug) DO UPDATE SET
         name = EXCLUDED.name,
         summary = EXCLUDED.summary,
         about = EXCLUDED.about,
         when_to_use = EXCLUDED.when_to_use,
         templates = EXCLUDED.templates,
         icon = EXCLUDED.icon,
         tint = EXCLUDED.tint`,
      [p.id, p.name, p.slug, p.summary, p.about, JSON.stringify(p.when_to_use), JSON.stringify(p.templates), p.icon, p.tint]
    );
  }
  console.log(`Synced ${patterns.rows.length} patterns.`);

  // 2. Sync DSA Sheets
  console.log('\n--- Syncing DSA Sheets ---');
  const sheets = await local.query('SELECT * FROM dsa_sheets');
  for (const s of sheets.rows) {
    await neon.query(
      `INSERT INTO dsa_sheets (id, title, slug, description, author, difficulty, total_problems, cover_tint)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (slug) DO UPDATE SET
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         author = EXCLUDED.author,
         difficulty = EXCLUDED.difficulty,
         total_problems = EXCLUDED.total_problems,
         cover_tint = EXCLUDED.cover_tint`,
      [s.id, s.title, s.slug, s.description, s.author, s.difficulty, s.total_problems, s.cover_tint]
    );
  }
  console.log(`Synced ${sheets.rows.length} sheets.`);

  // Build maps from local id -> Neon id for sheets and patterns by slug
  const neonSheetsRes = await neon.query('SELECT id, slug FROM dsa_sheets');
  const localSheetsRes = await local.query('SELECT id, slug FROM dsa_sheets');
  const sheetIdMap = new Map();
  for (const ls of localSheetsRes.rows) {
    const ns = neonSheetsRes.rows.find(r => r.slug === ls.slug);
    if (ns) sheetIdMap.set(ls.id, ns.id);
  }

  const neonPatternsRes = await neon.query('SELECT id, slug FROM dsa_patterns');
  const localPatternsRes = await local.query('SELECT id, slug FROM dsa_patterns');
  const patternIdMap = new Map();
  for (const lp of localPatternsRes.rows) {
    const np = neonPatternsRes.rows.find(r => r.slug === lp.slug);
    if (np) patternIdMap.set(lp.id, np.id);
  }

  // 3. Clear existing sample problems and solutions on Neon
  console.log('\n--- Syncing DSA Problems ---');
  await neon.query('DELETE FROM dsa_solutions');
  await neon.query('DELETE FROM dsa_problems');

  const problems = await local.query('SELECT * FROM dsa_problems ORDER BY order_index ASC');
  const probRows = problems.rows;
  console.log(`Total local problems to sync: ${probRows.length}`);

  const probCols = [
    'id', 'title', 'slug', 'statement', 'examples', 'constraints', 'hints',
    'editorial', 'practice_url', 'topic', 'subtopic', 'platform', 'video_url',
    'difficulty', 'order_index', 'sheet_id', 'pattern_id', 'created_at'
  ];

  const BATCH_SIZE = 100;
  let probCount = 0;

  for (let i = 0; i < probRows.length; i += BATCH_SIZE) {
    const chunk = probRows.slice(i, i + BATCH_SIZE);
    const valuePlaceholders = [];
    const values = [];

    chunk.forEach((row, rowIdx) => {
      // Map sheetId and patternId to Neon UUIDs
      const neonSheetId = sheetIdMap.get(row.sheet_id) || row.sheet_id;
      const neonPatternId = patternIdMap.get(row.pattern_id) || row.pattern_id;

      const rowPlaceholders = [];
      probCols.forEach((col, colIdx) => {
        let val = row[col];
        if (col === 'sheet_id') val = neonSheetId;
        if (col === 'pattern_id') val = neonPatternId;
        if (col === 'examples' || col === 'constraints' || col === 'hints') {
          val = JSON.stringify(val || []);
        }
        values.push(val);
        rowPlaceholders.push(`$${rowIdx * probCols.length + colIdx + 1}`);
      });
      valuePlaceholders.push(`(${rowPlaceholders.join(', ')})`);
    });

    const query = `
      INSERT INTO dsa_problems (${probCols.join(', ')})
      VALUES ${valuePlaceholders.join(', ')}
      ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        statement = EXCLUDED.statement,
        examples = EXCLUDED.examples,
        constraints = EXCLUDED.constraints,
        hints = EXCLUDED.hints,
        editorial = EXCLUDED.editorial,
        practice_url = EXCLUDED.practice_url,
        topic = EXCLUDED.topic,
        subtopic = EXCLUDED.subtopic,
        platform = EXCLUDED.platform,
        video_url = EXCLUDED.video_url,
        difficulty = EXCLUDED.difficulty,
        order_index = EXCLUDED.order_index,
        sheet_id = EXCLUDED.sheet_id,
        pattern_id = EXCLUDED.pattern_id
    `;

    await neon.query(query, values);
    probCount += chunk.length;
    process.stdout.write(`\rTransferred: ${probCount} / ${probRows.length} problems...`);
  }

  // 4. Sync DSA Solutions
  console.log('\n\n--- Syncing DSA Solutions ---');
  const solutions = await local.query('SELECT * FROM dsa_solutions');
  const solRows = solutions.rows;
  console.log(`Total local solutions to sync: ${solRows.length}`);

  const solCols = ['id', 'problem_id', 'language', 'code', 'complexity'];
  let solCount = 0;

  for (let i = 0; i < solRows.length; i += BATCH_SIZE) {
    const chunk = solRows.slice(i, i + BATCH_SIZE);
    const valuePlaceholders = [];
    const values = [];

    chunk.forEach((row, rowIdx) => {
      const rowPlaceholders = [];
      solCols.forEach((col, colIdx) => {
        values.push(row[col]);
        rowPlaceholders.push(`$${rowIdx * solCols.length + colIdx + 1}`);
      });
      valuePlaceholders.push(`(${rowPlaceholders.join(', ')})`);
    });

    const query = `
      INSERT INTO dsa_solutions (${solCols.join(', ')})
      VALUES ${valuePlaceholders.join(', ')}
      ON CONFLICT (id) DO NOTHING
    `;

    await neon.query(query, values);
    solCount += chunk.length;
    process.stdout.write(`\rTransferred: ${solCount} / ${solRows.length} solutions...`);
  }

  console.log('\n\n--- Verification on Neon ---');
  const neonSheets = await neon.query(`
    SELECT s.slug, s.title, s.total_problems, count(p.id)::int as actual_problems
    FROM dsa_sheets s
    LEFT JOIN dsa_problems p ON s.id = p.sheet_id
    GROUP BY s.id, s.slug, s.title, s.total_problems
    ORDER BY s.title
  `);
  console.table(neonSheets.rows);

  const neonTotalProbs = await neon.query('SELECT count(*) FROM dsa_problems');
  console.log(`\n🎉 Total DSA Problems now in Neon Cloud Database: ${neonTotalProbs.rows[0].count}`);

  await local.end();
  await neon.end();
}

main().catch(err => {
  console.error('\nDSA sync failed:', err);
  process.exit(1);
});
