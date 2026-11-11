import "dotenv/config";
import fs from "fs";
import { db } from "../src/db";
import { dsaPatterns, dsaProblems, dsaSheets, dsaSolutions } from "../src/db/schema";
import { eq, sql } from "drizzle-orm";

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

const PATTERN_CONFIGS = [
  { name: "Fast & Slow Pointers", slug: "fast-slow-pointers", tint: "#8B5CF6", icon: "activity", summary: "Detect cycles in linked lists, find middle elements, and solve tortoise-hare problems in O(1) space." },
  { name: "Sliding Window", slug: "sliding-window", tint: "#0EA5E9", icon: "maximize-2", summary: "Track continuous sub-arrays or sub-strings satisfying constraints in linear O(n) time." },
  { name: "Two Pointers", slug: "two-pointers", tint: "#10B981", icon: "git-commit", summary: "Use left/right or start/end pointers to search pairs in sorted arrays in O(n) time." },
  { name: "Overlapping Intervals", slug: "intervals", tint: "#F59E0B", icon: "calendar", summary: "Sort by start/end times and merge, insert, or check intersections of intervals." },
  { name: "Prefix Sum", slug: "prefix-sum", tint: "#EC4899", icon: "hash", summary: "Precompute cumulative sums for answering range sum queries in O(1) time." },
  { name: "Cyclic Sort", slug: "cyclic-sort", tint: "#6366F1", icon: "repeat", summary: "Place numbers 1..n at their respective array indices in O(n) time and O(1) extra space." },
  { name: "In-place Reversal of LinkedList", slug: "linked-list-reversal", tint: "#14B8A6", icon: "link", summary: "Reverse nodes in sublists or groups of k nodes without allocating extra memory." },
  { name: "Matrix Manipulation", slug: "matrix-manipulation", tint: "#F97316", icon: "grid", summary: "Traverse, rotate, spiral, or search 2D grids and matrices efficiently." },
  { name: "Breadth First Search (BFS)", slug: "bfs", tint: "#3B82F6", icon: "network", summary: "Level-order traversals, shortest path in unweighted graphs, and connected components." },
  { name: "Depth First Search (DFS)", slug: "dfs", tint: "#A855F7", icon: "git-branch", summary: "Traverse graphs and trees recursively, detect cycles, and explore paths." },
  { name: "Backtracking", slug: "backtracking", tint: "#EF4444", icon: "corner-down-left", summary: "Explore all permutations, subsets, N-Queens, and sudoku solving by undoing state." },
  { name: "Modified Binary Search", slug: "binary-search", tint: "#06B6D4", icon: "search", summary: "Search rotated sorted arrays, unknown bounds, or answer spaces in O(log n)." },
  { name: "Bitwise XOR", slug: "bitwise-xor", tint: "#84CC16", icon: "cpu", summary: "Leverage XOR properties (a ^ a = 0, a ^ 0 = a) to find missing or single numbers." },
  { name: "Top 'K' Elements", slug: "top-k-elements", tint: "#F59E0B", icon: "star", summary: "Find the K largest, smallest, or most frequent items using a Min/Max Heap in O(n log k)." },
  { name: "K-way Merge", slug: "k-way-merge", tint: "#64748B", icon: "git-merge", summary: "Merge K sorted arrays or lists into a single sorted list using a priority queue." },
  { name: "Two Heaps", slug: "two-heaps", tint: "#D97706", icon: "layers", summary: "Maintain two heaps (Max-Heap + Min-Heap) to calculate the running median of a stream in O(1)." },
  { name: "Monotonic Stack", slug: "monotonic-stack", tint: "#0284C7", icon: "bar-chart-2", summary: "Find the Next Greater/Smaller Element in O(n) time using an ordered stack." },
  { name: "Trees & Traversals", slug: "trees-traversals", tint: "#059669", icon: "folder-tree", summary: "Inorder, Preorder, Postorder, Lowest Common Ancestor, and Tree Diameter." },
  { name: "Dynamic Programming", slug: "dynamic-programming", tint: "#E11D48", icon: "zap", summary: "Break problems into overlapping subproblems with memoization and tabulation." },
  { name: "Graphs", slug: "graphs", tint: "#2563EB", icon: "share-2", summary: "Dijkstra's shortest path, Topological Sort, Minimum Spanning Tree, and Disjoint Set Union." },
  { name: "Greedy Algorithms", slug: "greedy", tint: "#4F46E5", icon: "target", summary: "Make locally optimal decisions at each step to reach a global optimum." },
  { name: "Design Data Structures", slug: "design-ds", tint: "#7C3AED", icon: "box", summary: "Implement LRU Cache, LFU Cache, Trie, and Min Stack combining hash maps and lists." },
];

async function main() {
  console.log("=== Seeding 20 Essential Patterns & Questions ===");

  // 1. Upsert all 22 patterns in dsa_patterns
  const patternIdMap = new Map<string, string>();

  for (const cfg of PATTERN_CONFIGS) {
    const [existing] = await db.select().from(dsaPatterns).where(eq(dsaPatterns.slug, cfg.slug)).limit(1);
    if (existing) {
      await db.update(dsaPatterns).set({
        name: cfg.name,
        summary: cfg.summary,
        icon: cfg.icon,
        tint: cfg.tint,
      }).where(eq(dsaPatterns.id, existing.id));
      patternIdMap.set(cfg.slug, existing.id);
      patternIdMap.set(cfg.name.toLowerCase(), existing.id);
    } else {
      const [inserted] = await db.insert(dsaPatterns).values({
        name: cfg.name,
        slug: cfg.slug,
        summary: cfg.summary,
        icon: cfg.icon,
        tint: cfg.tint,
      }).returning();
      patternIdMap.set(cfg.slug, inserted.id);
      patternIdMap.set(cfg.name.toLowerCase(), inserted.id);
    }
  }

  console.log(`[OK] Ensured all ${PATTERN_CONFIGS.length} patterns exist in dsa_patterns.`);

  // 2. Ensure "20-essential-dsa-patterns" sheet exists in dsa_sheets
  const sheetSlug = "20-essential-dsa-patterns";
  const [existingSheet] = await db.select().from(dsaSheets).where(eq(dsaSheets.slug, sheetSlug)).limit(1);
  let sheetId: string;
  if (existingSheet) {
    sheetId = existingSheet.id;
    await db.update(dsaSheets).set({
      title: "20 Essential DSA Patterns",
      author: "MAANG Engineers",
      description: "Master Data Structures & Algorithms with the ultimate interview preparation pattern sheet.",
      coverTint: "#6366F1",
      difficulty: "INTERMEDIATE",
    }).where(eq(dsaSheets.id, sheetId));
  } else {
    const [inserted] = await db.insert(dsaSheets).values({
      title: "20 Essential DSA Patterns",
      slug: sheetSlug,
      author: "MAANG Engineers",
      description: "Master Data Structures & Algorithms with the ultimate interview preparation pattern sheet.",
      coverTint: "#6366F1",
      difficulty: "INTERMEDIATE",
      totalProblems: 0,
    }).returning();
    sheetId = inserted.id;
  }

  // 3. Delete existing problems for this sheet
  await db.delete(dsaProblems).where(eq(dsaProblems.sheetId, sheetId));

  // 4. Load problems from src/data/essential-patterns.json
  const rawData = JSON.parse(fs.readFileSync("src/data/essential-patterns.json", "utf8"));
  const problemRows: any[] = [];
  let orderCounter = 1;

  const TOPIC_TO_SLUG: Record<string, string> = {
    "fast and slow pointer": "fast-slow-pointers",
    "fast and slow pointers": "fast-slow-pointers",
    "fast & slow pointers": "fast-slow-pointers",
    "overlapping intervals": "intervals",
    "intervals": "intervals",
    "prefix sum": "prefix-sum",
    "sliding window": "sliding-window",
    "two pointers": "two-pointers",
    "cyclic sort (index-based)": "cyclic-sort",
    "cyclic sort": "cyclic-sort",
    "reversal of linked list (in-place)": "linked-list-reversal",
    "in-place reversal of linkedlist": "linked-list-reversal",
    "matrix manipulation": "matrix-manipulation",
    "breadth first search (bfs)": "bfs",
    "depth first search (dfs)": "dfs",
    "backtracking": "backtracking",
    "modified binary search": "binary-search",
    "binary search": "binary-search",
    "bitwise xor": "bitwise-xor",
    "top 'k' elements": "top-k-elements",
    "top k elements": "top-k-elements",
    "k-way merge": "k-way-merge",
    "two heaps": "two-heaps",
    "monotonic stack": "monotonic-stack",
    "trees": "trees-traversals",
    "trees & traversals": "trees-traversals",
    "dynamic programming": "dynamic-programming",
    "graphs": "graphs",
    "greedy": "greedy",
    "greedy algorithms": "greedy",
    "design data structure": "design-ds",
    "design data structures": "design-ds",
  };

  for (const sec of rawData.sections) {
    const topic = sec.topic || "General";
    const subtopic = sec.subTopic || "";
    
    // Find matching pattern ID via explicit mapping
    const lowerTopic = topic.toLowerCase().trim();
    const matchedSlug = TOPIC_TO_SLUG[lowerTopic];
    let patternId = matchedSlug ? (patternIdMap.get(matchedSlug) ?? null) : null;

    if (!patternId) {
      for (const [key, id] of patternIdMap.entries()) {
        if (lowerTopic.includes(key) || key.includes(lowerTopic)) {
          patternId = id;
          break;
        }
      }
    }

    for (const prob of sec.problems) {
      const title = prob.title.trim();
      const practiceUrl = prob.problemUrl || "";
      const platform = prob.platform || "leetcode";
      const difficulty = normalizeDifficulty(prob.difficulty);
      const uniqueSlug = `${slugify(title)}-pattern-${orderCounter}`.slice(0, 155);

      problemRows.push({
        title,
        slug: uniqueSlug,
        statement: `Pattern practice problem: "${title}" on ${platform}. Pattern: ${topic}.`,
        practiceUrl,
        platform,
        videoUrl: null,
        topic,
        subtopic,
        difficulty,
        orderIndex: orderCounter++,
        sheetId,
        patternId,
        hints: [{ topic, subtopic, platform }],
      });
    }
  }

  // Chunk insert
  const chunkSize = 50;
  const insertedProblems: any[] = [];
  for (let i = 0; i < problemRows.length; i += chunkSize) {
    const chunk = problemRows.slice(i, i + chunkSize);
    const ins = await db.insert(dsaProblems).values(chunk).returning({ id: dsaProblems.id, title: dsaProblems.title });
    insertedProblems.push(...ins);
  }

  // Starter solutions
  const solutionRows = insertedProblems.map((p) => ({
    problemId: p.id,
    language: "cpp",
    code: `// Optimal implementation for ${p.title}\n#include <iostream>\n#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    // Solution code\n};`,
    complexity: "O(n) time, O(1) space",
  }));

  for (let i = 0; i < solutionRows.length; i += chunkSize) {
    const chunk = solutionRows.slice(i, i + chunkSize);
    await db.insert(dsaSolutions).values(chunk);
  }

  await db.update(dsaSheets).set({ totalProblems: problemRows.length }).where(eq(dsaSheets.id, sheetId));

  console.log(`[DONE] Inserted ${problemRows.length} problems for 20 Essential DSA Patterns!`);

  // 5. Link unassigned problems across all sheets to appropriate patterns
  const fastSlowId = patternIdMap.get("fast-slow-pointers");
  const linkedListReversalId = patternIdMap.get("linked-list-reversal");
  const slidingWindowId = patternIdMap.get("sliding-window");
  const twoPointersId = patternIdMap.get("two-pointers");
  const intervalsId = patternIdMap.get("intervals");
  const cyclicSortId = patternIdMap.get("cyclic-sort");

  if (fastSlowId) {
    await db.execute(sql`
      UPDATE dsa_problems
      SET pattern_id = ${fastSlowId}
      WHERE pattern_id IS NULL AND (
        LOWER(title) LIKE '%cycle%' OR
        LOWER(title) LIKE '%middle of the linked list%' OR
        LOWER(title) LIKE '%duplicate number%' OR
        LOWER(title) LIKE '%happy number%' OR
        LOWER(title) LIKE '%palindrome linked list%'
      )
    `);
  }

  if (linkedListReversalId) {
    await db.execute(sql`
      UPDATE dsa_problems
      SET pattern_id = ${linkedListReversalId}
      WHERE pattern_id IS NULL AND (
        (LOWER(topic) LIKE '%linked list%' OR LOWER(title) LIKE '%linked list%') AND
        (LOWER(title) LIKE '%reverse%' OR LOWER(title) LIKE '%swap nodes%' OR LOWER(title) LIKE '%reorder%')
      )
    `);
  }

  if (slidingWindowId) {
    await db.execute(sql`
      UPDATE dsa_problems
      SET pattern_id = ${slidingWindowId}
      WHERE pattern_id IS NULL AND LOWER(topic) LIKE '%sliding window%'
    `);
  }

  if (twoPointersId) {
    await db.execute(sql`
      UPDATE dsa_problems
      SET pattern_id = ${twoPointersId}
      WHERE pattern_id IS NULL AND LOWER(topic) LIKE '%two pointer%'
    `);
  }

  if (intervalsId) {
    await db.execute(sql`
      UPDATE dsa_problems
      SET pattern_id = ${intervalsId}
      WHERE pattern_id IS NULL AND (LOWER(topic) LIKE '%interval%' OR LOWER(title) LIKE '%interval%')
    `);
  }

  if (cyclicSortId) {
    await db.execute(sql`
      UPDATE dsa_problems
      SET pattern_id = ${cyclicSortId}
      WHERE pattern_id IS NULL AND (
        LOWER(title) LIKE '%missing number%' OR
        LOWER(title) LIKE '%first missing positive%' OR
        LOWER(title) LIKE '%find all numbers disappeared%' OR
        LOWER(title) LIKE '%find all duplicates%'
      )
    `);
  }

  // Count patterns
  const allPatterns = await db.select().from(dsaPatterns);
  console.log(`Total patterns in DB now: ${allPatterns.length}`);
  process.exit(0);
}

main().catch(console.error);

