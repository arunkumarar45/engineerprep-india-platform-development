import "dotenv/config";
import fs from "fs";
import { db } from "../src/db";
import { dsaSheets, dsaProblems, dsaSolutions, dsaPatterns } from "../src/db/schema";
import { eq, inArray, sql } from "drizzle-orm";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .slice(0, 80);
}

function normalizeDifficulty(diff?: string): "EASY" | "MEDIUM" | "HARD" {
  if (!diff) return "EASY";
  const d = diff.toLowerCase();
  if (d.includes("hard") || d.includes("adv")) return "HARD";
  if (d.includes("med")) return "MEDIUM";
  return "EASY";
}

function extractJsonObject(source: string, startKey: string): any {
  const keyIdx = source.indexOf(startKey, 2200000);
  if (keyIdx === -1) throw new Error(`Key not found: ${startKey}`);
  
  const braceStart = source.indexOf("{", keyIdx + startKey.length);
  if (braceStart === -1) throw new Error(`Opening brace not found after ${startKey}`);
  
  let depth = 0;
  let inString: string | null = null;
  let isEscaped = false;
  let endIdx = -1;
  
  for (let i = braceStart; i < source.length; i++) {
    const char = source[i];
    if (isEscaped) { isEscaped = false; continue; }
    if (char === "\\") { isEscaped = true; continue; }
    if (inString) {
      if (char === inString) inString = null;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      inString = char;
      continue;
    }
    if (char === "{") depth++;
    else if (char === "}") {
      depth--;
      if (depth === 0) { endIdx = i + 1; break; }
    }
  }
  
  if (endIdx === -1) throw new Error(`Matching closing brace not found for ${startKey}`);
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  return new Function(`return (${source.slice(braceStart, endIdx)})`)();
}

async function main() {
  console.log("=== Importing Full DSA Sheets from HackPaths ===");

  const filePath = process.env.TEMP + "/hackpaths_bundle.js";
  if (!fs.existsSync(filePath)) {
    throw new Error(`Bundle file not found at ${filePath}`);
  }
  const code = fs.readFileSync(filePath, "utf8");

  // Existing patterns for mapping
  const existingPatterns = await db.select().from(dsaPatterns);
  const patternMap = new Map<string, string>();
  for (const p of existingPatterns) {
    patternMap.set(p.name.toLowerCase(), p.id);
    patternMap.set(p.slug.toLowerCase(), p.id);
  }

  function findPatternId(topic: string): string | null {
    const t = topic.toLowerCase();
    for (const [key, id] of patternMap.entries()) {
      if (t.includes(key) || key.includes(t)) {
        return id;
      }
    }
    return null;
  }

  // Configuration for all 6 sheets
  const sheetConfigs = [
    {
      bundleKey: "love-babbar-dsa-sheet",
      dbSlug: "love-babbar-dsa-sheet",
      fallbackTitle: "Love Babbar DSA Sheet",
      author: "Love Babbar",
      tint: "#0284C7",
      difficulty: "BEGINNER" as const,
    },
    {
      bundleKey: "shradha-khapra-dsa-sheet",
      dbSlug: "shraddha-khapra-dsa-sheet",
      fallbackTitle: "Shraddha Khapra Sheet",
      author: "Shradha Khapra (Apna College)",
      tint: "#10B981",
      difficulty: "INTERMEDIATE" as const,
    },
    {
      bundleKey: "rohit-negi-dsa-sheet",
      dbSlug: "rohit-negi-dsa-sheet",
      fallbackTitle: "Rohit Negi (Coder Army) Sheet",
      author: "Rohit Negi (Coder Army)",
      tint: "#8B5CF6",
      difficulty: "INTERMEDIATE" as const,
    },
    {
      bundleKey: "arsh-goyal-dsa-sheet",
      dbSlug: "arsh-goyal-dsa-sheet",
      fallbackTitle: "Arsh Goyal DSA Sheet",
      author: "Arsh Goyal",
      tint: "#F59E0B",
      difficulty: "INTERMEDIATE" as const,
    },
    {
      bundleKey: "neetcode-dsa-sheet",
      dbSlug: "neetcode-dsa-sheet",
      fallbackTitle: "NeetCode DSA Sheet",
      author: "NeetCode",
      tint: "#06B6D4",
      difficulty: "ADVANCED" as const,
    },
    {
      bundleKey: "striver-a2z-dsa-sheet",
      dbSlug: "striver-a2z-dsa-sheet",
      fallbackTitle: "Striver's A2Z DSA Sheet",
      author: "Raj Vikramaditya (Striver)",
      tint: "#FF5A00",
      difficulty: "BEGINNER" as const,
    },
  ];

  for (const config of sheetConfigs) {
    console.log(`\nProcessing: ${config.fallbackTitle} (${config.bundleKey})...`);
    const rawData = extractJsonObject(code, `"${config.bundleKey}":`);
    
    // Find or create sheet
    const [existingSheet] = await db
      .select()
      .from(dsaSheets)
      .where(eq(dsaSheets.slug, config.dbSlug))
      .limit(1);

    let sheetId: string;
    if (existingSheet) {
      sheetId = existingSheet.id;
      await db
        .update(dsaSheets)
        .set({
          title: config.fallbackTitle,
          author: config.author,
          description: rawData.description || existingSheet.description,
          difficulty: config.difficulty,
          coverTint: config.tint,
        })
        .where(eq(dsaSheets.id, sheetId));
    } else {
      const [inserted] = await db
        .insert(dsaSheets)
        .values({
          slug: config.dbSlug,
          title: config.fallbackTitle,
          author: config.author,
          description: rawData.description || `Curated problem sheet by ${config.author}`,
          difficulty: config.difficulty,
          coverTint: config.tint,
          totalProblems: 0,
        })
        .returning();
      sheetId = inserted.id;
    }

    // Clean existing problems for this sheet
    await db.delete(dsaProblems).where(eq(dsaProblems.sheetId, sheetId));

    // Prepare problems
    const problemRows: any[] = [];
    let orderCounter = 1;

    for (const section of rawData.sections) {
      const topicName = section.topic || "General";
      const subtopicName = section.subTopic || section.section_title || "General";
      const matchedPatternId = findPatternId(topicName);

      for (const prob of section.problems) {
        const title = (prob.title || prob.problem_name || "Untitled Problem").trim();
        const practiceUrl = prob.problemUrl || prob.platform_link || "";
        const platform = prob.platform || prob.platform_name || (practiceUrl.includes("leetcode") ? "leetcode" : practiceUrl.includes("geeksforgeeks") ? "geeksforgeeks" : "takeuforward");
        const videoUrl = prob.video_link || null;
        const difficulty = normalizeDifficulty(prob.difficulty);
        
        // Ensure slug is unique, deterministic, and within 160 characters
        const baseSlug = slugify(title);
        const uniqueSlug = `${baseSlug}-${config.dbSlug}-${orderCounter}`.slice(0, 155);

        problemRows.push({
          title,
          slug: uniqueSlug,
          statement: `Practice problem "${title}" on ${platform}. Topic: ${topicName} · Subtopic: ${subtopicName}.`,
          practiceUrl,
          platform,
          videoUrl,
          topic: topicName,
          subtopic: subtopicName,
          difficulty,
          orderIndex: orderCounter++,
          sheetId,
          patternId: matchedPatternId,
          hints: [
            {
              topic: topicName,
              subtopic: subtopicName,
              platform,
              videoUrl,
              resource: prob.resource || null,
            },
          ],
        });
      }
    }

    // Batch insert problems in chunks of 50
    const chunkSize = 50;
    const insertedProblems: any[] = [];
    for (let i = 0; i < problemRows.length; i += chunkSize) {
      const chunk = problemRows.slice(i, i + chunkSize);
      const inserted = await db.insert(dsaProblems).values(chunk).returning({ id: dsaProblems.id, title: dsaProblems.title });
      insertedProblems.push(...inserted);
    }

    // Insert starter C++ solutions for problems
    const solutionRows = insertedProblems.map((p) => ({
      problemId: p.id,
      language: "cpp",
      code: `// Optimal C++ solution for: ${p.title}\n#include <iostream>\n#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    // Implementation\n};`,
      complexity: "O(n) time, O(1) space",
    }));

    for (let i = 0; i < solutionRows.length; i += chunkSize) {
      const chunk = solutionRows.slice(i, i + chunkSize);
      await db.insert(dsaSolutions).values(chunk);
    }

    // Update sheet total_problems
    await db
      .update(dsaSheets)
      .set({ totalProblems: problemRows.length })
      .where(eq(dsaSheets.id, sheetId));

    console.log(`[DONE] ${config.fallbackTitle}: Inserted ${problemRows.length} problems across ${rawData.sections.length} sections.`);
  }

  // Verification report
  const allSheets = await db.select().from(dsaSheets);
  console.log("\n================ Final Database Sheets Summary ================");
  for (const s of allSheets) {
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(dsaProblems)
      .where(eq(dsaProblems.sheetId, s.id));
    console.log(`- ${s.title} (${s.slug}): ${countResult.count} problems (Sheet total_problems: ${s.totalProblems})`);
  }
  console.log("===============================================================");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});

