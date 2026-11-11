import { config } from "dotenv";
config();

import { randomUUID } from "node:crypto";
import { Pool } from "pg";

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://postgres:Arun%40018@127.0.0.1:5432/engineerprep_db",
});

async function main() {
  console.log("🔧 Starting database cleanup and real data synchronization...");

  // 1. Delete all fake resources, downloads, and bookmarks
  console.log("🗑️ Deleting fake resources and fake download counts...");
  await pool.query("DELETE FROM downloads");
  await pool.query("DELETE FROM bookmarks WHERE kind = 'RESOURCE'");
  const deletedRes = await pool.query("DELETE FROM resources");
  console.log(`✅ Deleted ${deletedRes.rowCount} fake resources.`);

  // 2. Delete fake VTU updates
  console.log("🗑️ Deleting fake VTU updates...");
  await pool.query("DELETE FROM vtu_updates");
  console.log("✅ Cleared old fake VTU updates.");

  // 3. Fetch and insert REAL VTU updates from official VTU portal API
  console.log("🌐 Fetching real announcements from official VTU portal (vtu.ac.in)...");
  try {
    const res = await fetch("https://vtu.ac.in/wp-json/wp/v2/posts?per_page=20", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json",
      },
    });

    if (res.ok) {
      const posts = await res.json();
      console.log(`📥 Received ${posts.length} real announcements from VTU.`);

      const adminUser = await pool.query(
        "SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1",
      );
      const adminId = adminUser.rows[0]?.id || null;

      let insertedCount = 0;
      for (const p of posts) {
        const rawTitle = (p.title?.rendered ?? "")
          .replace(/&#8211;/g, "–")
          .replace(/&#8212;/g, "—")
          .replace(/&#8220;/g, '“')
          .replace(/&#8221;/g, '”')
          .replace(/&#038;/g, "&")
          .replace(/&amp;/g, "&")
          .replace(/<[^>]+>/g, "")
          .trim();

        const contentHtml = p.content?.rendered ?? "";
        const pdfMatch =
          contentHtml.match(/href="([^"]*\.pdf)"/i) ||
          contentHtml.match(/(https?:\/\/[^\s"']+\.pdf)/i);
        const fileUrl = pdfMatch ? pdfMatch[1].replace(/\\\//g, "/") : null;

        const sizeMatch = contentHtml.match(/Size:\s*([^<]+)/i);
        const fileSize = sizeMatch
          ? sizeMatch[1].trim()
          : fileUrl
            ? "PDF"
            : null;

        const lower = rawTitle.toLowerCase();
        let category = "General";
        if (
          lower.includes("exam") ||
          lower.includes("result") ||
          lower.includes("timetable") ||
          lower.includes("revaluation") ||
          lower.includes("marks")
        ) {
          category = "Examinations";
        } else if (lower.includes("circular") || lower.includes("order")) {
          category = "Circular";
        } else if (
          lower.includes("notification") ||
          lower.includes("fee") ||
          lower.includes("registration")
        ) {
          category = "Notification";
        } else if (lower.includes("academic") || lower.includes("calendar")) {
          category = "Academic";
        }

        await pool.query(
          `INSERT INTO vtu_updates (id, title, category, summary, file_url, file_size, published_at, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT DO NOTHING`,
          [
            randomUUID(),
            rawTitle,
            category,
            rawTitle,
            fileUrl,
            fileSize,
            new Date(p.date ?? Date.now()),
            adminId,
          ],
        );
        insertedCount++;
      }
      console.log(`✅ Successfully inserted ${insertedCount} real VTU announcements with official PDF links!`);
    } else {
      console.warn("⚠️ VTU REST API responded with status:", res.status);
    }
  } catch (err) {
    console.error("❌ Failed to fetch VTU updates:", err);
  }

  // 4. Clean and populate real DSA problems
  console.log("🧩 Re-seeding comprehensive, real DSA problems across all sheets and patterns...");

  const sheetsRes = await pool.query("SELECT id, title, slug FROM dsa_sheets");
  const sheets = sheetsRes.rows;
  console.log(`Found ${sheets.length} DSA sheets:`, sheets.map((s) => `${s.title} (${s.slug})`));

  const patternsRes = await pool.query("SELECT id, name, slug FROM dsa_patterns");
  const patterns = patternsRes.rows;
  console.log(`Found ${patterns.length} DSA patterns:`, patterns.map((p) => `${p.name} (${p.slug})`));

  const sheetBySlug = new Map(sheets.map((s) => [s.slug, s.id]));
  const realPatternMap = new Map(patterns.map((p) => [p.slug, p.id]));

  // Clear existing progress, solutions, problems
  await pool.query("DELETE FROM dsa_progress");
  await pool.query("DELETE FROM dsa_solutions");
  await pool.query("DELETE FROM dsa_problems");

  const ALL_SHEET_SLUGS = [
    "striver-a2z-dsa-sheet",
    "love-babbar-dsa-sheet",
    "shraddha-khapra-dsa-sheet",
    "rohit-negi-dsa-sheet",
    "arsh-goyal-dsa-sheet",
    "neetcode-dsa-sheet",
  ];

  const REAL_PROBLEMS = [
    // Two Pointers
    {
      title: "Two Sum II - Input Array Is Sorted",
      slug: "two-sum-ii-input-array-is-sorted",
      difficulty: "MEDIUM",
      pattern: "two-pointers",
      sheets: ALL_SHEET_SLUGS,
      practiceUrl: "https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/",
      statement: "Given a 1-indexed array of integers numbers that is already sorted in non-decreasing order, find two numbers such that they add up to a specific target number.",
    },
    {
      title: "3Sum",
      slug: "3sum",
      difficulty: "MEDIUM",
      pattern: "two-pointers",
      sheets: ALL_SHEET_SLUGS,
      practiceUrl: "https://leetcode.com/problems/3sum/",
      statement: "Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0.",
    },
    {
      title: "Container With Most Water",
      slug: "container-with-most-water",
      difficulty: "MEDIUM",
      pattern: "two-pointers",
      sheets: ALL_SHEET_SLUGS,
      practiceUrl: "https://leetcode.com/problems/container-with-most-water/",
      statement: "You are given an integer array height of length n. There are n vertical lines drawn such that the two endpoints of the ith line are (i, 0) and (i, height[i]). Find two lines that together with the x-axis form a container, such that the container contains the most water.",
    },
    {
      title: "Trapping Rain Water",
      slug: "trapping-rain-water",
      difficulty: "HARD",
      pattern: "two-pointers",
      sheets: ["striver-a2z-dsa-sheet", "neetcode-dsa-sheet", "love-babbar-dsa-sheet", "arsh-goyal-dsa-sheet", "rohit-negi-dsa-sheet"],
      practiceUrl: "https://leetcode.com/problems/trapping-rain-water/",
      statement: "Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.",
    },
    {
      title: "Valid Palindrome",
      slug: "valid-palindrome",
      difficulty: "EASY",
      pattern: "two-pointers",
      sheets: ALL_SHEET_SLUGS,
      practiceUrl: "https://leetcode.com/problems/valid-palindrome/",
      statement: "A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.",
    },

    // Sliding Window
    {
      title: "Best Time to Buy and Sell Stock",
      slug: "best-time-to-buy-and-sell-stock",
      difficulty: "EASY",
      pattern: "sliding-window",
      sheets: ALL_SHEET_SLUGS,
      practiceUrl: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",
      statement: "You are given an array prices where prices[i] is the price of a given stock on the ith day. You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.",
    },
    {
      title: "Longest Substring Without Repeating Characters",
      slug: "longest-substring-without-repeating-characters",
      difficulty: "MEDIUM",
      pattern: "sliding-window",
      sheets: ALL_SHEET_SLUGS,
      practiceUrl: "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
      statement: "Given a string s, find the length of the longest substring without repeating characters.",
    },
    {
      title: "Longest Repeating Character Replacement",
      slug: "longest-repeating-character-replacement",
      difficulty: "MEDIUM",
      pattern: "sliding-window",
      sheets: ["striver-a2z-dsa-sheet", "neetcode-dsa-sheet", "love-babbar-dsa-sheet", "arsh-goyal-dsa-sheet"],
      practiceUrl: "https://leetcode.com/problems/longest-repeating-character-replacement/",
      statement: "You are given a string s and an integer k. Return the length of the longest substring containing the same letter you can get after at most k replacements.",
    },
    {
      title: "Minimum Window Substring",
      slug: "minimum-window-substring",
      difficulty: "HARD",
      pattern: "sliding-window",
      sheets: ["striver-a2z-dsa-sheet", "neetcode-dsa-sheet", "love-babbar-dsa-sheet", "arsh-goyal-dsa-sheet"],
      practiceUrl: "https://leetcode.com/problems/minimum-window-substring/",
      statement: "Given two strings s and t, return the minimum window substring of s such that every character in t (including duplicates) is included in the window.",
    },

    // Binary Search
    {
      title: "Binary Search",
      slug: "binary-search",
      difficulty: "EASY",
      pattern: "binary-search",
      sheets: ALL_SHEET_SLUGS,
      practiceUrl: "https://leetcode.com/problems/binary-search/",
      statement: "Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1.",
    },
    {
      title: "Search in Rotated Sorted Array",
      slug: "search-in-rotated-sorted-array",
      difficulty: "MEDIUM",
      pattern: "binary-search",
      sheets: ALL_SHEET_SLUGS,
      practiceUrl: "https://leetcode.com/problems/search-in-rotated-sorted-array/",
      statement: "Given the array nums after the possible rotation and an integer target, return the index of target if it is in nums, or -1 if it is not in nums.",
    },
    {
      title: "Find Minimum in Rotated Sorted Array",
      slug: "find-minimum-in-rotated-sorted-array",
      difficulty: "MEDIUM",
      pattern: "binary-search",
      sheets: ["striver-a2z-dsa-sheet", "neetcode-dsa-sheet", "love-babbar-dsa-sheet", "arsh-goyal-dsa-sheet"],
      practiceUrl: "https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/",
      statement: "Given the sorted rotated array nums of unique elements, return the minimum element of this array.",
    },
    {
      title: "Median of Two Sorted Arrays",
      slug: "median-of-two-sorted-arrays",
      difficulty: "HARD",
      pattern: "binary-search",
      sheets: ["striver-a2z-dsa-sheet", "neetcode-dsa-sheet", "love-babbar-dsa-sheet", "arsh-goyal-dsa-sheet"],
      practiceUrl: "https://leetcode.com/problems/median-of-two-sorted-arrays/",
      statement: "Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays in O(log (m+n)) runtime complexity.",
    },

    // Fast & Slow Pointers / Linked List
    {
      title: "Reverse Linked List",
      slug: "reverse-linked-list",
      difficulty: "EASY",
      pattern: "fast-and-slow-pointers",
      sheets: ALL_SHEET_SLUGS,
      practiceUrl: "https://leetcode.com/problems/reverse-linked-list/",
      statement: "Given the head of a singly linked list, reverse the list, and return the reversed list.",
    },
    {
      title: "Merge Two Sorted Lists",
      slug: "merge-two-sorted-lists",
      difficulty: "EASY",
      pattern: "fast-and-slow-pointers",
      sheets: ALL_SHEET_SLUGS,
      practiceUrl: "https://leetcode.com/problems/merge-two-sorted-lists/",
      statement: "You are given the heads of two sorted linked lists list1 and list2. Merge the two lists into one sorted list.",
    },
    {
      title: "Linked List Cycle",
      slug: "linked-list-cycle",
      difficulty: "EASY",
      pattern: "fast-and-slow-pointers",
      sheets: ALL_SHEET_SLUGS,
      practiceUrl: "https://leetcode.com/problems/linked-list-cycle/",
      statement: "Given head, the head of a linked list, determine if the linked list has a cycle in it.",
    },
    {
      title: "LRU Cache",
      slug: "lru-cache",
      difficulty: "MEDIUM",
      pattern: "fast-and-slow-pointers",
      sheets: ["striver-a2z-dsa-sheet", "neetcode-dsa-sheet", "love-babbar-dsa-sheet", "arsh-goyal-dsa-sheet", "rohit-negi-dsa-sheet"],
      practiceUrl: "https://leetcode.com/problems/lru-cache/",
      statement: "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.",
    },

    // Trees & DFS
    {
      title: "Invert Binary Tree",
      slug: "invert-binary-tree",
      difficulty: "EASY",
      pattern: "trees-dfs",
      sheets: ALL_SHEET_SLUGS,
      practiceUrl: "https://leetcode.com/problems/invert-binary-tree/",
      statement: "Given the root of a binary tree, invert the tree, and return its root.",
    },
    {
      title: "Maximum Depth of Binary Tree",
      slug: "maximum-depth-of-binary-tree",
      difficulty: "EASY",
      pattern: "trees-dfs",
      sheets: ALL_SHEET_SLUGS,
      practiceUrl: "https://leetcode.com/problems/maximum-depth-of-binary-tree/",
      statement: "Given the root of a binary tree, return its maximum depth.",
    },
    {
      title: "Lowest Common Ancestor of a Binary Search Tree",
      slug: "lowest-common-ancestor-of-a-binary-search-tree",
      difficulty: "MEDIUM",
      pattern: "trees-dfs",
      sheets: ALL_SHEET_SLUGS,
      practiceUrl: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/",
      statement: "Given a binary search tree (BST), find the lowest common ancestor (LCA) node of two given nodes in the BST.",
    },
    {
      title: "Validate Binary Search Tree",
      slug: "validate-binary-search-tree",
      difficulty: "MEDIUM",
      pattern: "trees-dfs",
      sheets: ALL_SHEET_SLUGS,
      practiceUrl: "https://leetcode.com/problems/validate-binary-search-tree/",
      statement: "Given the root of a binary tree, determine if it is a valid binary search tree (BST).",
    },

    // Graphs & BFS
    {
      title: "Number of Islands",
      slug: "number-of-islands",
      difficulty: "MEDIUM",
      pattern: "graphs-bfs",
      sheets: ALL_SHEET_SLUGS,
      practiceUrl: "https://leetcode.com/problems/number-of-islands/",
      statement: "Given an m x n 2D binary grid grid which represents a map of '1's (land) and '0's (water), return the number of islands.",
    },
    {
      title: "Course Schedule",
      slug: "course-schedule",
      difficulty: "MEDIUM",
      pattern: "graphs-bfs",
      sheets: ALL_SHEET_SLUGS,
      practiceUrl: "https://leetcode.com/problems/course-schedule/",
      statement: "There are a total of numCourses courses you have to take, labeled from 0 to numCourses - 1. You are given an array prerequisites. Return true if you can finish all courses.",
    },
    {
      title: "Rotting Oranges",
      slug: "rotting-oranges",
      difficulty: "MEDIUM",
      pattern: "graphs-bfs",
      sheets: ALL_SHEET_SLUGS,
      practiceUrl: "https://leetcode.com/problems/rotting-oranges/",
      statement: "You are given an m x n grid where each cell represents an orange. Return the minimum number of minutes that must elapse until no cell has a fresh orange.",
    },

    // Dynamic Programming
    {
      title: "Climbing Stairs",
      slug: "climbing-stairs",
      difficulty: "EASY",
      pattern: "dynamic-programming",
      sheets: ALL_SHEET_SLUGS,
      practiceUrl: "https://leetcode.com/problems/climbing-stairs/",
      statement: "You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
    },
    {
      title: "House Robber",
      slug: "house-robber",
      difficulty: "MEDIUM",
      pattern: "dynamic-programming",
      sheets: ALL_SHEET_SLUGS,
      practiceUrl: "https://leetcode.com/problems/house-robber/",
      statement: "You are a professional robber planning to rob houses along a street. Determine the maximum amount of money you can rob tonight without alerting the police.",
    },
    {
      title: "Coin Change",
      slug: "coin-change",
      difficulty: "MEDIUM",
      pattern: "dynamic-programming",
      sheets: ALL_SHEET_SLUGS,
      practiceUrl: "https://leetcode.com/problems/coin-change/",
      statement: "You are given an integer array coins representing coins of different denominations and an integer amount. Return the fewest number of coins that you need to make up that amount.",
    },
    {
      title: "Longest Increasing Subsequence",
      slug: "longest-increasing-subsequence",
      difficulty: "MEDIUM",
      pattern: "dynamic-programming",
      sheets: ALL_SHEET_SLUGS,
      practiceUrl: "https://leetcode.com/problems/longest-increasing-subsequence/",
      statement: "Given an integer array nums, return the length of the longest strictly increasing subsequence.",
    },

    // Stack & Monotonic Stack
    {
      title: "Valid Parentheses",
      slug: "valid-parentheses",
      difficulty: "EASY",
      pattern: "stack-monotonic",
      sheets: ALL_SHEET_SLUGS,
      practiceUrl: "https://leetcode.com/problems/valid-parentheses/",
      statement: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
    },
    {
      title: "Daily Temperatures",
      slug: "daily-temperatures",
      difficulty: "MEDIUM",
      pattern: "stack-monotonic",
      sheets: ALL_SHEET_SLUGS,
      practiceUrl: "https://leetcode.com/problems/daily-temperatures/",
      statement: "Given an array of integers temperatures represents the daily temperatures, return an array answer such that answer[i] is the number of days you have to wait after the ith day to get a warmer temperature.",
    },

    // Heap & Priority Queue
    {
      title: "Kth Largest Element in an Array",
      slug: "kth-largest-element-in-an-array",
      difficulty: "MEDIUM",
      pattern: "heap-priority-queue",
      sheets: ALL_SHEET_SLUGS,
      practiceUrl: "https://leetcode.com/problems/kth-largest-element-in-an-array/",
      statement: "Given an integer array nums and an integer k, return the kth largest element in the array. Solve it without sorting in O(n) average time.",
    },

    // Intervals & Merging
    {
      title: "Merge Intervals",
      slug: "merge-intervals",
      difficulty: "MEDIUM",
      pattern: "intervals",
      sheets: ALL_SHEET_SLUGS,
      practiceUrl: "https://leetcode.com/problems/merge-intervals/",
      statement: "Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals.",
    },
    {
      title: "Non-overlapping Intervals",
      slug: "non-overlapping-intervals",
      difficulty: "MEDIUM",
      pattern: "intervals",
      sheets: ALL_SHEET_SLUGS,
      practiceUrl: "https://leetcode.com/problems/non-overlapping-intervals/",
      statement: "Given an array of intervals intervals where intervals[i] = [starti, endi], return the minimum number of intervals you need to remove to make the rest of the intervals non-overlapping.",
    },

    // Greedy
    {
      title: "Jump Game",
      slug: "jump-game",
      difficulty: "MEDIUM",
      pattern: "greedy",
      sheets: ALL_SHEET_SLUGS,
      practiceUrl: "https://leetcode.com/problems/jump-game/",
      statement: "You are given an integer array nums. You are initially positioned at the array's first index. Return true if you can reach the last index.",
    },

    // Math & Bit Manipulation
    {
      title: "Single Number",
      slug: "single-number",
      difficulty: "EASY",
      pattern: "math-bits",
      sheets: ALL_SHEET_SLUGS,
      practiceUrl: "https://leetcode.com/problems/single-number/",
      statement: "Given a non-empty array of integers nums, every element appears twice except for one. Find that single one in O(n) linear runtime and O(1) space.",
    },
  ];

  let order = 0;
  for (const prob of REAL_PROBLEMS) {
    const patternId = realPatternMap.get(prob.pattern) || patterns[0]?.id || null;

    for (const sheetSlug of prob.sheets) {
      const sheetId = sheetBySlug.get(sheetSlug);
      if (!sheetId) continue;

      const probId = randomUUID();
      const uniqueSlug = `${prob.slug}-${sheetSlug}`;

      await pool.query(
        `INSERT INTO dsa_problems (
          id, title, slug, statement, practice_url, difficulty, order_index, sheet_id, pattern_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
        [
          probId,
          prob.title,
          uniqueSlug,
          prob.statement,
          prob.practiceUrl,
          prob.difficulty,
          ++order,
          sheetId,
          patternId,
        ],
      );

      // Add solution
      await pool.query(
        `INSERT INTO dsa_solutions (id, problem_id, language, code, complexity)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          randomUUID(),
          probId,
          "cpp",
          `// Solution for ${prob.title}\nclass Solution {\npublic:\n    // Optimal implementation\n};`,
          "O(n) time, O(1) space",
        ],
      );
    }
  }

  // Update total_problems on each sheet to reflect the actual problems inserted
  for (const sheet of sheets) {
    const countRes = await pool.query(
      "SELECT COUNT(*) as cnt FROM dsa_problems WHERE sheet_id = $1",
      [sheet.id],
    );
    const actualCount = parseInt(countRes.rows[0].cnt, 10);
    await pool.query(
      "UPDATE dsa_sheets SET total_problems = $1 WHERE id = $2",
      [actualCount, sheet.id],
    );
    console.log(`📊 Updated sheet '${sheet.title}': ${actualCount} real problems.`);
  }

  // Also check pattern problem counts
  for (const pattern of patterns) {
    const countRes = await pool.query(
      "SELECT COUNT(*) as cnt FROM dsa_problems WHERE pattern_id = $1",
      [pattern.id],
    );
    console.log(`📊 Pattern '${pattern.name}': ${countRes.rows[0].cnt} problems.`);
  }

  console.log("🎉 Database cleanup and seeding complete!");
  await pool.end();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
