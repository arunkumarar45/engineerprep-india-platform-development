import fs from 'fs';
const content = fs.readFileSync('src/db/schema.ts', 'utf8');

function showTable(tableName) {
  const start = content.indexOf(`pgTable("${tableName}"`);
  const altStart = content.indexOf(`pgTable(\n  "${tableName}"`);
  const idx = start !== -1 ? start : altStart;
  if (idx !== -1) {
    const end = content.indexOf(');\n', idx);
    console.log(`\n=================== ${tableName} ===================`);
    console.log(content.substring(idx - 30, end + 3));
  }
}

showTable('dsa_sheets');
showTable('dsa_patterns');
showTable('dsa_problems');
showTable('roadmaps');
showTable('mock_tests');
showTable('opportunities');

