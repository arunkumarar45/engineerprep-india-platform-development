/**
 * EngineerPrep India — development seed.
 * Run with:  npx tsx scripts/seed.ts
 */
import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, sql } from "drizzle-orm";
import {
  automationExecutions,
  automationRules,
  automationSettings,
  bookmarks,
  branches,
  companies,
  dsaPatterns,
  dsaProblems,
  dsaProgress,
  dsaSheets,
  dsaSolutions,
  downloads,
  importJobs,
  jobApplications,
  learningActivities,
  mockTests,
  notificationPreferences,
  notificationTemplates,
  notifications,
  opportunities,
  questionOptions,
  questions,
  resources,
  roadmapProgress,
  roadmapStages,
  roadmapTopics,
  roadmaps,
  savedOpportunities,
  scheduledTasks,
  schemes,
  semesters,
  studentStreaks,
  subjects,
  users,
  vtuUpdates,
} from "../src/db/schema";

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ??
    "postgresql://postgres:postgres@127.0.0.1:5432/app_db",
});
const db = drizzle(pool);

/* ----------------------------- helpers ------------------------------ */

const id = () => randomUUID();
const day = 86400000;
const now = Date.now();

function pick<T>(list: T[], i: number) {
  return list[i % list.length];
}

const BRANCHES = [
  { code: "CSE", name: "Computer Science & Engineering" },
  { code: "ISE", name: "Information Science & Engineering" },
  { code: "ECE", name: "Electronics & Communication" },
  { code: "EEE", name: "Electrical & Electronics" },
  { code: "ME", name: "Mechanical Engineering" },
  { code: "CIV", name: "Civil Engineering" },
];

const SCHEMES = ["2022", "2025", "2026"];

const SUBJECTS_BY_SEM: Record<number, string[]> = {
  3: [
    "Engineering Mathematics III",
    "Data Structures & Algorithms",
    "Analog & Digital Electronics",
    "Computer Organization",
    "Software Engineering",
  ],
  4: [
    "Engineering Mathematics IV",
    "Analysis & Design of Algorithms",
    "Operating Systems",
    "Microcontrollers",
    "Database Management Systems",
  ],
  5: [
    "Automata Theory & Compiler Design",
    "Computer Networks",
    "Artificial Intelligence & ML",
    "Big Data Analytics",
    "Web Technology",
  ],
  6: [
    "System Software",
    "Computer Graphics",
    "Data Science",
    "Cloud Computing",
    "Cyber Security",
  ],
};

const BRANCH_SUBJECTS: Record<string, Record<number, string[]>> = {
  ECE: {
    3: ["Engineering Mathematics III", "Electronic Circuits", "Digital System Design", "Network Analysis", "Signals & Systems"],
    4: ["Engineering Mathematics IV", "Linear Control Systems", "Microprocessors", "Analog Communication", "Electromagnetics"],
    5: ["Digital Signal Processing", "Principles of Communication", "Verilog HDL", "Microcontrollers", "Antennas & Propagation"],
    6: ["Digital Image Processing", "VLSI Design", "Embedded Systems", "Wireless Communication", "Operating Systems"],
  },
  EEE: {
    3: ["Engineering Mathematics III", "Electric Circuit Analysis", "Digital Electronics", "Electrical Machines I", "Measurements"],
    4: ["Engineering Mathematics IV", "Electrical Machines II", "Control Systems I", "Power Electronics I", "Network Analysis"],
    5: ["Power Systems I", "Signals & Systems", "Microprocessors", "Electrical Machine Design", "Control Systems II"],
    6: ["Power Systems II", "Power Electronics II", "Digital Signal Processing", "Switchgear & Protection", "Utilization of Electrical Energy"],
  },
  ME: {
    3: ["Engineering Mathematics III", "Mechanics of Materials", "Materials Science", "Basic Thermodynamics", "Manufacturing Process I"],
    4: ["Engineering Mathematics IV", "Applied Thermodynamics", "Fluid Mechanics", "Kinematics of Machines", "Manufacturing Process II"],
    5: ["Heat & Mass Transfer", "Design of Machine Elements I", "Dynamics of Machines", "Metrology & Measurements", "Turbo Machines"],
    6: ["Design of Machine Elements II", "Refrigeration & Air Conditioning", "Mechatronics", "Operations Research", "CAD/CAM"],
  },
  CIV: {
    3: ["Engineering Mathematics III", "Strength of Materials", "Building Materials", "Surveying I", "Fluid Mechanics"],
    4: ["Engineering Mathematics IV", "Structural Analysis I", "Hydraulics & Hydraulic Machines", "Concrete Technology", "Surveying II"],
    5: ["Design of RC Structures", "Structural Analysis II", "Geotechnical Engineering I", "Transportation Engineering I", "Water Resources"],
    6: ["Design of Steel Structures", "Foundation Engineering", "Environmental Engineering I", "Transportation Engineering II", "Quantity Surveying"],
  },
};

const DEMO_FILES = [
  { url: "/demo-files/vtu-module-notes.pdf", size: "PDF 2.1 MB" },
  { url: "/demo-files/vtu-question-paper.pdf", size: "PDF 640 KB" },
  { url: "/demo-files/vtu-syllabus.pdf", size: "PDF 410 KB" },
  { url: "/demo-files/vtu-lab-manual.pdf", size: "PDF 1.4 MB" },
  { url: "/demo-files/vtu-assignment.pdf", size: "PDF 260 KB" },
];

/* ------------------------------ patterns ---------------------------- */

type PatternSeed = {
  name: string;
  slug: string;
  summary: string;
  about: string;
  whenToUse: string[];
  icon: string;
  tint: string;
  problems: Array<{
    title: string;
    slug: string;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    statement: string;
    examples: Array<{ input: string; output: string; explanation: string }>;
    constraints: string[];
    hints: string[];
    editorial: string;
    practiceUrl: string;
    solutions: Array<{ language: string; code: string; complexity: string }>;
  }>;
};

const codeJava = (name: string) => `class Solution {
    // ${name}
    public int solve(int[] nums) {
        int left = 0, right = nums.length - 1;
        while (left < right) {
            // logic
            left++;
            right--;
        }
        return 0;
    }
}`;

const codePython = (name: string) => `def solve(nums):
    """${name}"""
    left, right = 0, len(nums) - 1
    while left < right:
        # logic
        left += 1
        right -= 1
    return 0`;

const codeCpp = (name: string) => `class Solution {
public:
    // ${name}
    int solve(vector<int>& nums) {
        int left = 0, right = nums.size() - 1;
        while (left < right) {
            // logic
            left++; right--;
        }
        return 0;
    }
};`;

const patternTemplates = {
  java: codeJava("Two Pointers"),
  python: codePython("Two Pointers"),
  cpp: codeCpp("Two Pointers"),
};

const PATTERNS: PatternSeed[] = [
  {
    name: "Two Pointers",
    slug: "two-pointers",
    summary:
      "Two pointers traverse a sequence from opposite ends (or same direction) to reduce O(n²) scans to O(n).",
    about:
      "The Two Pointers technique uses two indices to traverse an array or string, often from both ends, to reduce time complexity from O(n²) to O(n). It is widely used in problems involving sorted arrays, subarrays and pair finding.",
    whenToUse: [
      "Finding pairs or triplets",
      "Removing duplicates",
      "Merging arrays",
      "Subarray with a condition",
      "Palindrome validation",
    ],
    icon: "sparkles",
    tint: "#FF5A00",
    problems: [
      {
        title: "Two Sum II – Input Array Is Sorted",
        slug: "two-sum-ii-input-array-is-sorted",
        difficulty: "EASY",
        statement:
          "Given a 1-indexed array of integers `numbers` that is already sorted in non-decreasing order, find two numbers such that they add up to a specific `target` number. Return the indices of the two numbers (1-indexed) as an integer array `[index1, index2]`.",
        examples: [
          {
            input: "numbers = [2,7,11,15], target = 9",
            output: "[1,2]",
            explanation: "2 + 7 = 9, therefore index1 = 1, index2 = 2.",
          },
          {
            input: "numbers = [2,3,4], target = 6",
            output: "[1,3]",
            explanation: "2 + 4 = 6.",
          },
        ],
        constraints: [
          "2 <= numbers.length <= 3 * 10⁴",
          "-1000 <= numbers[i] <= 1000",
          "numbers is sorted in non-decreasing order",
        ],
        hints: [
          "Because the array is sorted, use one pointer at each end.",
          "If the sum is too large, move the right pointer left.",
        ],
        editorial:
          "Place `left` at 0 and `right` at the end. Compute the sum: if it equals target, return. If the sum is smaller, increment `left` to increase it; otherwise decrement `right`. This visits each element at most once → O(n) time, O(1) space.",
        practiceUrl: "https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/",
        solutions: [
          { language: "Java", code: codeJava("Two Sum II"), complexity: "O(n) time · O(1) space" },
          { language: "Python", code: codePython("Two Sum II"), complexity: "O(n) time · O(1) space" },
          { language: "C++", code: codeCpp("Two Sum II"), complexity: "O(n) time · O(1) space" },
        ],
      },
      {
        title: "Container With Most Water",
        slug: "container-with-most-water",
        difficulty: "MEDIUM",
        statement:
          "You are given an integer array `height` of length n. There are n vertical lines drawn such that the two endpoints of the ith line are (i, 0) and (i, height[i]). Find two lines that together with the x-axis form a container that holds the most water.",
        examples: [
          {
            input: "height = [1,8,6,2,5,4,8,3,7]",
            output: "49",
            explanation:
              "The max area is between index 1 (height 8) and index 8 (height 7).",
          },
        ],
        constraints: ["n == height.length", "2 <= n <= 10⁵", "0 <= height[i] <= 10⁴"],
        hints: [
          "Area = min(height[l], height[r]) * (r - l).",
          "Always move the pointer at the shorter line.",
        ],
        editorial:
          "Start with the widest container (both ends). The area is limited by the shorter line, so discard it by moving that pointer inward. Repeat until the pointers meet → O(n).",
        practiceUrl: "https://leetcode.com/problems/container-with-most-water/",
        solutions: [
          { language: "Java", code: codeJava("Container With Most Water"), complexity: "O(n) time · O(1) space" },
          { language: "Python", code: codePython("Container With Most Water"), complexity: "O(n) time · O(1) space" },
          { language: "C++", code: codeCpp("Container With Most Water"), complexity: "O(n) time · O(1) space" },
        ],
      },
      {
        title: "3Sum",
        slug: "3sum",
        difficulty: "MEDIUM",
        statement:
          "Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i, j and k are distinct and nums[i] + nums[j] + nums[k] == 0.",
        examples: [
          {
            input: "nums = [-1,0,1,2,-1,-4]",
            output: "[[-1,-1,2],[-1,0,1]]",
            explanation: "The distinct triplets are [-1,-1,2] and [-1,0,1].",
          },
        ],
        constraints: ["3 <= nums.length <= 3000", "-10⁵ <= nums[i] <= 10⁵"],
        hints: ["Sort the array first.", "Fix one number, then apply two pointers on the remainder."],
        editorial:
          "Sort, fix index i, and run two pointers for the remaining range. Skip duplicates after each iteration. Time complexity O(n²), space O(1) ignoring output.",
        practiceUrl: "https://leetcode.com/problems/3sum/",
        solutions: [
          { language: "Java", code: codeJava("3Sum"), complexity: "O(n²) time · O(1) space" },
          { language: "Python", code: codePython("3Sum"), complexity: "O(n²) time · O(1) space" },
          { language: "C++", code: codeCpp("3Sum"), complexity: "O(n²) time · O(1) space" },
        ],
      },
      {
        title: "Remove Duplicates from Sorted Array",
        slug: "remove-duplicates-from-sorted-array",
        difficulty: "EASY",
        statement:
          "Given an integer array nums sorted in non-decreasing order, remove the duplicates in-place such that each unique element appears only once, keeping the relative order. Return the number of unique elements.",
        examples: [
          {
            input: "nums = [1,1,2]",
            output: "2, nums = [1,2,_]",
            explanation: "Return k = 2 with the first two elements being 1 and 2.",
          },
        ],
        constraints: ["1 <= nums.length <= 3 * 10⁴", "-100 <= nums[i] <= 100", "nums is sorted"],
        hints: ["Use a slow pointer for the next write position.", "A fast pointer scans for new values."],
        editorial:
          "Slow pointer marks the boundary of unique elements; fast pointer finds the next distinct value and writes it at slow+1. O(n) time, O(1) extra space.",
        practiceUrl: "https://leetcode.com/problems/remove-duplicates-from-sorted-array/",
        solutions: [
          { language: "Java", code: codeJava("Remove Duplicates"), complexity: "O(n) time · O(1) space" },
          { language: "Python", code: codePython("Remove Duplicates"), complexity: "O(n) time · O(1) space" },
          { language: "C++", code: codeCpp("Remove Duplicates"), complexity: "O(n) time · O(1) space" },
        ],
      },
    ],
  },
  {
    name: "Sliding Window",
    slug: "sliding-window",
    summary:
      "Maintain a moving window over contiguous data to answer range questions in linear time.",
    about:
      "The Sliding Window pattern keeps a window of elements (contiguous subarray/substring) and expands or shrinks it while maintaining a running aggregate — sum, frequency map, max — giving O(n) solutions for many substring/subarray problems.",
    whenToUse: [
      "Longest / shortest substring with a constraint",
      "Fixed-size subarray sums",
      "Maximum of every window of size k",
      "Anagram / permutation matching",
    ],
    icon: "sparkles",
    tint: "#2B6CB0",
    problems: [
      {
        title: "Longest Substring Without Repeating Characters",
        slug: "longest-substring-without-repeating-characters",
        difficulty: "MEDIUM",
        statement:
          "Given a string s, find the length of the longest substring without repeating characters.",
        examples: [
          { input: 's = "abcabcbb"', output: "3", explanation: 'The answer is "abc", with length 3.' },
          { input: 's = "bbbbb"', output: "1", explanation: 'The answer is "b".' },
        ],
        constraints: ["0 <= s.length <= 5 * 10⁴", "s consists of English letters, digits, symbols and spaces"],
        hints: ["Expand the right pointer, shrink from the left on a duplicate.", "Track the last index of every character."],
        editorial:
          "Use a hash map of character → last index. When a duplicate appears inside the window, jump the left pointer. O(n) time, O(min(n, charset)) space.",
        practiceUrl: "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
        solutions: [
          { language: "Java", code: codeJava("Longest Substring"), complexity: "O(n) time · O(n) space" },
          { language: "Python", code: codePython("Longest Substring"), complexity: "O(n) time · O(n) space" },
          { language: "C++", code: codeCpp("Longest Substring"), complexity: "O(n) time · O(n) space" },
        ],
      },
      {
        title: "Best Time to Buy and Sell Stock",
        slug: "best-time-to-buy-and-sell-stock",
        difficulty: "EASY",
        statement:
          "You are given an array prices where prices[i] is the price of a given stock on the ith day. Choose a single day to buy and a different future day to sell, maximising profit. Return the maximum profit (0 if none).",
        examples: [{ input: "prices = [7,1,5,3,6,4]", output: "5", explanation: "Buy on day 2 (price 1) and sell on day 5 (price 6)." }],
        constraints: ["1 <= prices.length <= 10⁵", "0 <= prices[i] <= 10⁴"],
        hints: ["Track the minimum price seen so far.", "Profit = current price - minimum so far."],
        editorial:
          "Single pass tracking the running minimum. O(n) time, O(1) space.",
        practiceUrl: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",
        solutions: [
          { language: "Java", code: codeJava("Best Time to Buy Stock"), complexity: "O(n) time · O(1) space" },
          { language: "Python", code: codePython("Best Time to Buy Stock"), complexity: "O(n) time · O(1) space" },
          { language: "C++", code: codeCpp("Best Time to Buy Stock"), complexity: "O(n) time · O(1) space" },
        ],
      },
    ],
  },
  {
    name: "Binary Search",
    slug: "binary-search",
    summary:
      "Halve the search space on sorted data or on a monotonic answer space.",
    about:
      "Binary Search is not limited to arrays — apply it to any monotonic predicate. If you can answer 'is x feasible?', you can binary search the boundary between feasible and infeasible answers.",
    whenToUse: [
      "Sorted array lookups",
      "First/last occurrence of a value",
      "Search in rotated arrays",
      "Minimise the maximum (binary search on answer)",
    ],
    icon: "sparkles",
    tint: "#22A06B",
    problems: [
      {
        title: "Search in Rotated Sorted Array",
        slug: "search-in-rotated-sorted-array",
        difficulty: "MEDIUM",
        statement:
          "There is an integer array nums sorted in ascending order (with distinct values) that is rotated at an unknown pivot. Given target, return its index or -1.",
        examples: [{ input: "nums = [4,5,6,7,0,1,2], target = 0", output: "4", explanation: "0 is present at index 4." }],
        constraints: ["1 <= nums.length <= 5000", "All values are unique"],
        hints: ["One half of the array is always sorted.", "Decide which half to continue in."],
        editorial:
          "At each step identify the sorted half. If the target lies within the sorted half's bounds, search there; otherwise search the other half. O(log n).",
        practiceUrl: "https://leetcode.com/problems/search-in-rotated-sorted-array/",
        solutions: [
          { language: "Java", code: codeJava("Rotated Search"), complexity: "O(log n) time · O(1) space" },
          { language: "Python", code: codePython("Rotated Search"), complexity: "O(log n) time · O(1) space" },
          { language: "C++", code: codeCpp("Rotated Search"), complexity: "O(log n) time · O(1) space" },
        ],
      },
      {
        title: "Koko Eating Bananas",
        slug: "koko-eating-bananas",
        difficulty: "MEDIUM",
        statement:
          "Koko loves to eat bananas. There are n piles of bananas, and she can decide her eating speed k (bananas per hour). Find the minimum integer k such that she can eat all bananas within h hours.",
        examples: [{ input: "piles = [3,6,7,11], h = 8", output: "4", explanation: "At speed 4 she finishes in 8 hours." }],
        constraints: ["1 <= piles.length <= 10⁴", "piles.length <= h <= 10⁹"],
        hints: ["Binary search the answer k between 1 and max(piles).", "Check feasibility with ceiling division."],
        editorial:
          "Binary search on the answer: for a candidate speed, total hours = sum(ceil(pile/k)). O(n log max(pile)).",
        practiceUrl: "https://leetcode.com/problems/koko-eating-bananas/",
        solutions: [
          { language: "Java", code: codeJava("Koko Bananas"), complexity: "O(n log m) time" },
          { language: "Python", code: codePython("Koko Bananas"), complexity: "O(n log m) time" },
          { language: "C++", code: codeCpp("Koko Bananas"), complexity: "O(n log m) time" },
        ],
      },
    ],
  },
  {
    name: "Fast & Slow Pointers",
    slug: "fast-and-slow-pointers",
    summary: "Detect cycles and find middle nodes in linked lists in one pass.",
    about:
      "A slow pointer moving one step and a fast pointer moving two steps can detect cycles (Floyd's algorithm) and locate the middle of a linked list without extra memory.",
    whenToUse: [
      "Cycle detection in linked lists",
      "Finding the middle node",
      "Finding the start of a cycle",
      "Happy number style state machines",
    ],
    icon: "sparkles",
    tint: "#7C3AED",
    problems: [
      {
        title: "Linked List Cycle",
        slug: "linked-list-cycle",
        difficulty: "EASY",
        statement:
          "Given head, the head of a linked list, determine if the linked list has a cycle in it.",
        examples: [{ input: "head = [3,2,0,-4], pos = 1", output: "true", explanation: "The tail connects to the second node." }],
        constraints: ["Number of nodes ≤ 10⁴", "-10⁵ <= Node.val <= 10⁵"],
        hints: ["Move slow by 1 and fast by 2.", "If they meet, there is a cycle."],
        editorial: "Floyd's cycle detection. O(n) time, O(1) space.",
        practiceUrl: "https://leetcode.com/problems/linked-list-cycle/",
        solutions: [
          { language: "Java", code: codeJava("Linked List Cycle"), complexity: "O(n) time · O(1) space" },
          { language: "Python", code: codePython("Linked List Cycle"), complexity: "O(n) time · O(1) space" },
          { language: "C++", code: codeCpp("Linked List Cycle"), complexity: "O(n) time · O(1) space" },
        ],
      },
    ],
  },
  {
    name: "Trees & DFS",
    slug: "trees-dfs",
    summary: "Traverse, search and aggregate tree data with depth-first recursion.",
    about:
      "Depth-first traversal (pre/in/post order) lets you solve path sums, LCA, subtree checks and BST validation with clean recursion. Iterative stacks replace recursion when depth is large.",
    whenToUse: [
      "Path / root-to-leaf problems",
      "Lowest common ancestor",
      "BST validation",
      "Serialising a tree",
    ],
    icon: "sparkles",
    tint: "#F5A623",
    problems: [
      {
        title: "Maximum Depth of Binary Tree",
        slug: "maximum-depth-of-binary-tree",
        difficulty: "EASY",
        statement:
          "Given the root of a binary tree, return its maximum depth (number of nodes along the longest root-to-leaf path).",
        examples: [{ input: "root = [3,9,20,null,null,15,7]", output: "3", explanation: "The longest path has 3 nodes." }],
        constraints: ["Number of nodes ≤ 10⁴", "-100 <= Node.val <= 100"],
        hints: ["Depth = 1 + max(depth(left), depth(right))."],
        editorial: "Simple post-order DFS. O(n) time, O(h) recursion space.",
        practiceUrl: "https://leetcode.com/problems/maximum-depth-of-binary-tree/",
        solutions: [
          { language: "Java", code: codeJava("Max Depth"), complexity: "O(n) time" },
          { language: "Python", code: codePython("Max Depth"), complexity: "O(n) time" },
          { language: "C++", code: codeCpp("Max Depth"), complexity: "O(n) time" },
        ],
      },
    ],
  },
  {
    name: "Graphs & BFS",
    slug: "graphs-bfs",
    summary: "Level-order traversal, shortest paths in unweighted graphs and grid problems.",
    about:
      "Breadth-first search explores layer by layer, giving shortest paths in unweighted graphs and natural solutions for grids, rotting-orange style propagation and word ladders.",
    whenToUse: [
      "Shortest path in an unweighted graph",
      "Level-order traversal",
      "Grid flood fill",
      "Minimum number of steps",
    ],
    icon: "sparkles",
    tint: "#0EA5E9",
    problems: [
      {
        title: "Number of Islands",
        slug: "number-of-islands",
        difficulty: "MEDIUM",
        statement:
          "Given an m x n 2D binary grid which represents a map of '1's (land) and '0's (water), return the number of islands.",
        examples: [
          {
            input: 'grid = [["1","1","0"],["1","0","0"],["0","0","1"]]',
            output: "2",
            explanation: "There are two separate land masses.",
          },
        ],
        constraints: ["m == grid.length", "n == grid[i].length", "1 <= m, n <= 300"],
        hints: ["Scan every cell; when you find land, BFS/DFS the whole island.", "Mark visited cells as water."],
        editorial: "Flood fill with BFS/DFS. O(m*n) time, O(min(m,n)) space for the queue.",
        practiceUrl: "https://leetcode.com/problems/number-of-islands/",
        solutions: [
          { language: "Java", code: codeJava("Number of Islands"), complexity: "O(m·n) time" },
          { language: "Python", code: codePython("Number of Islands"), complexity: "O(m·n) time" },
          { language: "C++", code: codeCpp("Number of Islands"), complexity: "O(m·n) time" },
        ],
      },
    ],
  },
  {
    name: "Dynamic Programming",
    slug: "dynamic-programming",
    summary: "Break overlapping subproblems into memoised states.",
    about:
      "Dynamic programming stores results of overlapping subproblems so each is computed once. Start with a recursive formulation, add memoisation, then convert to a bottom-up table or space-optimised rolling array.",
    whenToUse: [
      "Counting / optimisation with choices",
      "Knapsack style constraints",
      "Longest common subsequence",
      "Grid path problems",
    ],
    icon: "sparkles",
    tint: "#E5484D",
    problems: [
      {
        title: "Climbing Stairs",
        slug: "climbing-stairs",
        difficulty: "EASY",
        statement:
          "You are climbing a staircase with n steps. Each time you can climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
        examples: [{ input: "n = 3", output: "3", explanation: "1+1+1, 1+2, 2+1." }],
        constraints: ["1 <= n <= 45"],
        hints: ["ways(n) = ways(n-1) + ways(n-2).", "Only two previous values are needed."],
        editorial: "Fibonacci recurrence with two rolling variables. O(n) time, O(1) space.",
        practiceUrl: "https://leetcode.com/problems/climbing-stairs/",
        solutions: [
          { language: "Java", code: codeJava("Climbing Stairs"), complexity: "O(n) time · O(1) space" },
          { language: "Python", code: codePython("Climbing Stairs"), complexity: "O(n) time · O(1) space" },
          { language: "C++", code: codeCpp("Climbing Stairs"), complexity: "O(n) time · O(1) space" },
        ],
      },
    ],
  },
  {
    name: "Greedy Algorithms",
    slug: "greedy",
    summary: "Take the locally optimal choice at each step with proof of global optimality.",
    about:
      "Greedy algorithms build a solution piece by piece, choosing the option that looks best right now. They are fast (usually O(n log n) after sorting) but require an exchange argument to prove correctness.",
    whenToUse: [
      "Interval scheduling",
      "Minimum number of platforms / meeting rooms",
      "Task assignment with sorting",
      "Huffman style merging",
    ],
    icon: "sparkles",
    tint: "#14B8A6",
    problems: [
      {
        title: "Assign Cookies",
        slug: "assign-cookies",
        difficulty: "EASY",
        statement:
          "Given greed factors of children and sizes of cookies, maximise the number of content children. Each child gets at most one cookie, and cookie size must be >= greed factor.",
        examples: [{ input: "g = [1,2,3], s = [1,1]", output: "1", explanation: "Only the child with greed 1 can be satisfied." }],
        constraints: ["1 <= g.length, s.length <= 3 * 10⁴"],
        hints: ["Sort both arrays.", "Match the smallest sufficient cookie to the least greedy child."],
        editorial: "Two pointers over sorted arrays. O(n log n) time.",
        practiceUrl: "https://leetcode.com/problems/assign-cookies/",
        solutions: [
          { language: "Java", code: codeJava("Assign Cookies"), complexity: "O(n log n) time" },
          { language: "Python", code: codePython("Assign Cookies"), complexity: "O(n log n) time" },
          { language: "C++", code: codeCpp("Assign Cookies"), complexity: "O(n log n) time" },
        ],
      },
    ],
  },
  {
    name: "Stack & Monotonic Stack",
    slug: "stack-monotonic",
    summary: "Resolve nearest greater/smaller element questions with a monotonic stack.",
    about:
      "A monotonic stack keeps elements in increasing or decreasing order so that the next smaller/greater element can be found in O(1) amortised time. It powers histogram, temperature and parenthesis problems.",
    whenToUse: [
      "Next greater / smaller element",
      "Largest rectangle in a histogram",
      "Valid parentheses",
      "Daily temperatures",
    ],
    icon: "sparkles",
    tint: "#8B5CF6",
    problems: [
      {
        title: "Valid Parentheses",
        slug: "valid-parentheses",
        difficulty: "EASY",
        statement:
          "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
        examples: [{ input: 's = "()[]{}"', output: "true", explanation: "Every bracket closes in the correct order." }],
        constraints: ["1 <= s.length <= 10⁴", "s consists of parentheses only"],
        hints: ["Push opening brackets onto a stack.", "On a closing bracket, the top must match."],
        editorial: "Stack matching. O(n) time, O(n) space.",
        practiceUrl: "https://leetcode.com/problems/valid-parentheses/",
        solutions: [
          { language: "Java", code: codeJava("Valid Parentheses"), complexity: "O(n) time" },
          { language: "Python", code: codePython("Valid Parentheses"), complexity: "O(n) time" },
          { language: "C++", code: codeCpp("Valid Parentheses"), complexity: "O(n) time" },
        ],
      },
    ],
  },
  {
    name: "Heap & Priority Queue",
    slug: "heap-priority-queue",
    summary: "Track the k largest/smallest elements with a heap in O(log k).",
    about:
      "Heaps give fast access to the extreme element. Keep a min-heap of size k for the k largest elements, and a max-heap for the k smallest — a staple for streaming and scheduling problems.",
    whenToUse: [
      "K largest / smallest elements",
      "Merge k sorted lists",
      "Median of a stream",
      "Task scheduling by priority",
    ],
    icon: "sparkles",
    tint: "#F59E0B",
    problems: [
      {
        title: "Kth Largest Element in an Array",
        slug: "kth-largest-element-in-an-array",
        difficulty: "MEDIUM",
        statement:
          "Given an integer array nums and an integer k, return the kth largest element in the array.",
        examples: [{ input: "nums = [3,2,1,5,6,4], k = 2", output: "5", explanation: "Sorted descending: 6, 5, 4 …" }],
        constraints: ["1 <= k <= nums.length <= 10⁵", "-10⁴ <= nums[i] <= 10⁴"],
        hints: ["Maintain a min-heap of size k.", "Pop when the heap exceeds k."],
        editorial: "Min-heap of size k. O(n log k) time, O(k) space.",
        practiceUrl: "https://leetcode.com/problems/kth-largest-element-in-an-array/",
        solutions: [
          { language: "Java", code: codeJava("Kth Largest"), complexity: "O(n log k) time" },
          { language: "Python", code: codePython("Kth Largest"), complexity: "O(n log k) time" },
          { language: "C++", code: codeCpp("Kth Largest"), complexity: "O(n log k) time" },
        ],
      },
    ],
  },
  {
    name: "Intervals & Merging",
    slug: "intervals",
    summary: "Sort by start time and sweep to merge or schedule intervals.",
    about:
      "Most interval problems reduce to sorting by start time and sweeping while tracking the current boundary. Merge overlapping intervals, count required rooms, or detect conflicts in a single pass.",
    whenToUse: [
      "Merge overlapping intervals",
      "Meeting rooms / minimum platforms",
      "Insert interval",
      "Non-overlapping intervals",
    ],
    icon: "sparkles",
    tint: "#3B82F6",
    problems: [
      {
        title: "Merge Intervals",
        slug: "merge-intervals",
        difficulty: "MEDIUM",
        statement:
          "Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals and return an array of the non-overlapping intervals that cover all the intervals in the input.",
        examples: [{ input: "intervals = [[1,3],[2,6],[8,10],[15,18]]", output: "[[1,6],[8,10],[15,18]]", explanation: "[1,3] and [2,6] overlap." }],
        constraints: ["1 <= intervals.length <= 10⁴", "intervals[i] are sorted by start"],
        hints: ["Sort by start time.", "If the next start <= current end, merge."],
        editorial: "Sort + sweep. O(n log n) time.",
        practiceUrl: "https://leetcode.com/problems/merge-intervals/",
        solutions: [
          { language: "Java", code: codeJava("Merge Intervals"), complexity: "O(n log n) time" },
          { language: "Python", code: codePython("Merge Intervals"), complexity: "O(n log n) time" },
          { language: "C++", code: codeCpp("Merge Intervals"), complexity: "O(n log n) time" },
        ],
      },
    ],
  },
  {
    name: "Math & Bit Manipulation",
    slug: "math-bits",
    summary: "Use number theory and bitwise identities to avoid loops.",
    about:
      "XOR, AND and shift operations solve many array and number puzzles in O(1) space. Know the classics: a ^ a = 0, n & (n-1) clears the lowest set bit, and x & -x isolates it.",
    whenToUse: [
      "Single number among duplicates",
      "Counting set bits",
      "Power of two checks",
      "Swapping without a temp",
    ],
    icon: "sparkles",
    tint: "#EC4899",
    problems: [
      {
        title: "Single Number",
        slug: "single-number",
        difficulty: "EASY",
        statement:
          "Given a non-empty array of integers nums, every element appears twice except for one. Find that single one in linear time and constant space.",
        examples: [{ input: "nums = [4,1,2,1,2]", output: "4", explanation: "All other numbers appear twice." }],
        constraints: ["1 <= nums.length <= 3 * 10⁴", "-3 * 10⁴ <= nums[i] <= 3 * 10⁴"],
        hints: ["XOR is commutative and self-inverse.", "Pairs cancel out to 0."],
        editorial: "XOR everything. O(n) time, O(1) space.",
        practiceUrl: "https://leetcode.com/problems/single-number/",
        solutions: [
          { language: "Java", code: codeJava("Single Number"), complexity: "O(n) time · O(1) space" },
          { language: "Python", code: codePython("Single Number"), complexity: "O(n) time · O(1) space" },
          { language: "C++", code: codeCpp("Single Number"), complexity: "O(n) time · O(1) space" },
        ],
      },
    ],
  },
];

/* ------------------------------- sheets ----------------------------- */

const SHEETS = [
  {
    title: "Striver's A2Z DSA Sheet",
    author: "Raj Vikramaditya (Striver)",
    slug: "striver-a2z-dsa-sheet",
    difficulty: "BEGINNER" as const,
    coverTint: "#FF5A00",
    description:
      "Step-by-step A2Z sheet covering basics, sorting, arrays, binary search, strings, linked lists, trees, graphs, DP and more.",
  },
  {
    title: "Love Babbar DSA Sheet",
    author: "Love Babbar",
    slug: "love-babbar-dsa-sheet",
    difficulty: "BEGINNER" as const,
    coverTint: "#2B6CB0",
    description:
      "450 curated problems arranged in a 60-day completion plan with arrays, strings, recursions and DP.",
  },
  {
    title: "Shraddha Khapra Sheet",
    author: "Shraddha Khapra",
    slug: "shraddha-khapra-dsa-sheet",
    difficulty: "INTERMEDIATE" as const,
    coverTint: "#22A06B",
    description:
      "375 problems focused on interview patterns with an emphasis on arrays, strings and recursion.",
  },
  {
    title: "Rohit Negi DSA Sheet",
    author: "Rohit Negi (Coder Army)",
    slug: "rohit-negi-dsa-sheet",
    difficulty: "INTERMEDIATE" as const,
    coverTint: "#7C3AED",
    description:
      "300 problems designed for product-based company interviews with detailed revision plans.",
  },
  {
    title: "Arsh Goyal DSA Sheet",
    author: "Arsh Goyal",
    slug: "arsh-goyal-dsa-sheet",
    difficulty: "INTERMEDIATE" as const,
    coverTint: "#F5A623",
    description:
      "287 problems with a strong focus on SDE-1 interviews, including topic-wise revision sheets.",
  },
  {
    title: "NeetCode DSA Sheet",
    author: "NeetCode",
    slug: "neetcode-dsa-sheet",
    difficulty: "ADVANCED" as const,
    coverTint: "#0EA5E9",
    description:
      "450 problems organised by pattern — blind 75, NeetCode 150 and the full NeetCode 250.",
  },
];

/* ------------------------------ roadmaps ---------------------------- */

const ROADMAPS = [
  {
    title: "Full Stack Developer Roadmap",
    slug: "full-stack-developer-roadmap",
    category: "Full Stack",
    icon: "layers",
    coverTint: "#FF5A00",
    difficulty: "INTERMEDIATE" as const,
    estimatedDuration: "6 months",
    description:
      "Complete path to become a full stack developer with modern tools: React, Node.js, databases and deployment.",
    stages: [
      {
        title: "Web Foundations",
        description: "HTML, CSS and the browser rendering model.",
        topics: [
          ["Semantic HTML & accessibility", "MDN Web Docs", 90],
          ["CSS layout: Flexbox & Grid", "CSS Tricks", 120],
          ["Responsive design & media queries", "web.dev", 90],
          ["JavaScript fundamentals", "javascript.info", 240],
        ],
      },
      {
        title: "Frontend Engineering",
        description: "Component-driven UIs with React and TypeScript.",
        topics: [
          ["Modern JavaScript (ES6+)", "javascript.info", 180],
          ["React fundamentals & hooks", "react.dev", 240],
          ["State management patterns", "TanStack Query", 120],
          ["Tailwind CSS & design systems", "tailwindcss.com", 120],
        ],
      },
      {
        title: "Backend & APIs",
        description: "Servers, REST/GraphQL APIs and authentication.",
        topics: [
          ["Node.js & Express", "nodejs.org", 180],
          ["REST API design", "REST API Tutorial", 120],
          ["Authentication & JWT", "OWASP Cheat Sheet", 120],
          ["PostgreSQL & SQL", "postgresqltutorial.com", 180],
        ],
      },
      {
        title: "Ship & Scale",
        description: "Testing, CI/CD, Docker and cloud deployment.",
        topics: [
          ["Testing (Jest, Playwright)", "testing-library.com", 150],
          ["Docker & containers", "docker.com", 150],
          ["CI/CD with GitHub Actions", "docs.github.com", 120],
          ["Deploy on Vercel / AWS", "vercel.com", 90],
        ],
      },
    ],
  },
  {
    title: "DevOps Engineer Roadmap",
    slug: "devops-engineer-roadmap",
    category: "DevOps",
    icon: "server",
    coverTint: "#0EA5E9",
    difficulty: "ADVANCED" as const,
    estimatedDuration: "4 months",
    description: "Learn DevOps from basics to advanced with CI/CD, Docker and Kubernetes.",
    stages: [
      {
        title: "Linux & Networking",
        description: "Command line, processes and networking fundamentals.",
        topics: [
          ["Linux command line", "Linux Journey", 180],
          ["Shell scripting", "Bash Guide", 120],
          ["Networking & DNS basics", "Cloudflare Learning", 120],
          ["Git & GitHub workflows", "git-scm.com", 120],
        ],
      },
      {
        title: "Containers",
        description: "Package applications reproducibly.",
        topics: [
          ["Docker fundamentals", "docker.com", 150],
          ["Docker Compose", "docs.docker.com", 90],
          ["Container registries", "Docker Hub", 60],
        ],
      },
      {
        title: "CI/CD & Orchestration",
        description: "Automate delivery and run at scale.",
        topics: [
          ["CI/CD pipelines", "GitHub Actions", 150],
          ["Kubernetes fundamentals", "kubernetes.io", 240],
          ["Helm charts", "helm.sh", 90],
          ["Monitoring with Prometheus", "prometheus.io", 150],
        ],
      },
      {
        title: "Cloud & IaC",
        description: "Provision infrastructure as code.",
        topics: [
          ["AWS core services", "aws.amazon.com", 240],
          ["Terraform basics", "terraform.io", 180],
          ["Logging with ELK", "elastic.co", 120],
        ],
      },
    ],
  },
  {
    title: "Data Analyst Roadmap",
    slug: "data-analyst-roadmap",
    category: "Data & AI",
    icon: "chart",
    coverTint: "#22A06B",
    difficulty: "BEGINNER" as const,
    estimatedDuration: "3 months",
    description: "A practical roadmap to become a job-ready data analyst with SQL, Excel and Python.",
    stages: [
      {
        title: "Spreadsheets & SQL",
        description: "The analyst's daily tools.",
        topics: [
          ["Excel / Google Sheets", "Microsoft Learn", 180],
          ["SQL joins & aggregations", "Mode SQL Tutorial", 180],
          ["Window functions", "Postgres docs", 120],
        ],
      },
      {
        title: "Python for Analysis",
        description: "Automate analysis with pandas.",
        topics: [
          ["Python basics", "Automate the Boring Stuff", 180],
          ["NumPy & pandas", "pandas.pydata.org", 180],
          ["Data cleaning workflows", "Kaggle Learn", 120],
        ],
      },
      {
        title: "Visualisation & BI",
        description: "Communicate insight effectively.",
        topics: [
          ["Matplotlib & Seaborn", "matplotlib.org", 120],
          ["Power BI / Tableau", "Microsoft Learn", 180],
          ["Dashboard storytelling", "Storytelling with Data", 90],
        ],
      },
      {
        title: "Statistics & Portfolio",
        description: "Back your analysis with statistics.",
        topics: [
          ["Descriptive & inferential stats", "Khan Academy", 180],
          ["A/B testing basics", "Optimizely", 90],
          ["Build a portfolio project", "Kaggle", 150],
        ],
      },
    ],
  },
  {
    title: "Java Backend Roadmap",
    slug: "java-backend-roadmap",
    category: "Backend",
    icon: "coffee",
    coverTint: "#E5484D",
    difficulty: "INTERMEDIATE" as const,
    estimatedDuration: "5 months",
    description: "Core Java, collections, Spring Boot, databases and system design for backend roles.",
    stages: [
      {
        title: "Core Java",
        description: "Language, OOP and the JVM.",
        topics: [
          ["Java syntax & OOP", "Oracle Java Tutorials", 240],
          ["Collections & generics", "Oracle Java Tutorials", 180],
          ["Streams & lambdas", "Oracle Java Tutorials", 150],
          ["Exception handling & IO", "Oracle Java Tutorials", 120],
        ],
      },
      {
        title: "Advanced Java",
        description: "Concurrency, JVM internals and testing.",
        topics: [
          ["Multithreading & concurrency", "Jenkov Tutorials", 180],
          ["JUnit & Mockito", "junit.org", 120],
          ["Maven / Gradle", "maven.apache.org", 90],
        ],
      },
      {
        title: "Spring Boot",
        description: "Build production REST services.",
        topics: [
          ["Spring Core & DI", "spring.io", 150],
          ["Spring Boot REST APIs", "spring.io", 240],
          ["Spring Data JPA & Hibernate", "spring.io", 180],
          ["Spring Security", "spring.io", 150],
        ],
      },
      {
        title: "Data & Scale",
        description: "Databases, caching and messaging.",
        topics: [
          ["SQL & PostgreSQL", "postgresqltutorial.com", 180],
          ["Redis caching", "redis.io", 120],
          ["Kafka messaging", "kafka.apache.org", 150],
          ["Microservices & Docker", "spring.io", 180],
        ],
      },
    ],
  },
  {
    title: "Python Developer Roadmap",
    slug: "python-developer-roadmap",
    category: "Backend",
    icon: "terminal",
    coverTint: "#F5A623",
    difficulty: "BEGINNER" as const,
    estimatedDuration: "3 months",
    description: "From Python basics to Django/FastAPI services and automation projects.",
    stages: [
      {
        title: "Python Core",
        description: "Syntax, data structures and modules.",
        topics: [
          ["Python syntax & types", "docs.python.org", 150],
          ["Data structures", "docs.python.org", 120],
          ["Comprehensions & functions", "Real Python", 120],
          ["Virtualenv & packaging", "packaging.python.org", 60],
        ],
      },
      {
        title: "Web Development",
        description: "Ship APIs and web apps.",
        topics: [
          ["Django fundamentals", "docs.djangoproject.com", 180],
          ["FastAPI & async", "fastapi.tiangolo.com", 150],
          ["SQLAlchemy & PostgreSQL", "sqlalchemy.org", 120],
        ],
      },
      {
        title: "Automation & Tooling",
        description: "Scripting, testing and deployment.",
        topics: [
          ["Scripting & automation", "Automate the Boring Stuff", 120],
          ["pytest", "docs.pytest.org", 90],
          ["Docker & deployment", "docker.com", 120],
        ],
      },
    ],
  },
  {
    title: "Frontend Developer Roadmap",
    slug: "frontend-developer-roadmap",
    category: "Web Dev",
    icon: "layout",
    coverTint: "#7C3AED",
    difficulty: "BEGINNER" as const,
    estimatedDuration: "3 months",
    description: "HTML, CSS, JavaScript, React and performance for frontend engineering roles.",
    stages: [
      {
        title: "Foundations",
        description: "The web platform.",
        topics: [
          ["HTML semantics & forms", "MDN", 120],
          ["CSS architecture", "MDN", 150],
          ["JavaScript essentials", "javascript.info", 240],
          ["DOM & events", "MDN", 120],
        ],
      },
      {
        title: "Modern Frontend",
        description: "Frameworks and tooling.",
        topics: [
          ["React & hooks", "react.dev", 240],
          ["TypeScript", "typescriptlang.org", 180],
          ["Vite & bundling", "vitejs.dev", 90],
          ["Testing frontends", "testing-library.com", 120],
        ],
      },
      {
        title: "Production Skills",
        description: "Accessibility, performance and DX.",
        topics: [
          ["Accessibility (WCAG)", "webaim.org", 120],
          ["Core Web Vitals", "web.dev", 120],
          ["Design systems", "storybook.js.org", 120],
        ],
      },
    ],
  },
  {
    title: "AI/ML Engineer Roadmap",
    slug: "ai-ml-engineer-roadmap",
    category: "Data & AI",
    icon: "brain",
    coverTint: "#EC4899",
    difficulty: "ADVANCED" as const,
    estimatedDuration: "6 months",
    description: "Python, maths, classical ML, deep learning and MLOps for AI engineering roles.",
    stages: [
      {
        title: "Maths & Python",
        description: "Linear algebra, calculus and probability.",
        topics: [
          ["Linear algebra", "3Blue1Brown", 180],
          ["Probability & statistics", "Khan Academy", 180],
          ["NumPy & pandas", "pandas.pydata.org", 150],
          ["Matplotlib", "matplotlib.org", 90],
        ],
      },
      {
        title: "Classical ML",
        description: "Regression, trees and validation.",
        topics: [
          ["Supervised learning", "scikit-learn", 180],
          ["Model evaluation", "scikit-learn", 120],
          ["Feature engineering", "Kaggle Learn", 120],
        ],
      },
      {
        title: "Deep Learning",
        description: "Neural networks and transformers.",
        topics: [
          ["Neural network basics", "d2l.ai", 180],
          ["PyTorch", "pytorch.org", 240],
          ["Transformers & NLP", "huggingface.co", 180],
        ],
      },
      {
        title: "MLOps",
        description: "Serve and monitor models.",
        topics: [
          ["Experiment tracking", "wandb.ai", 90],
          ["Model serving", "fastapi.tiangolo.com", 120],
          ["Cloud ML", "aws.amazon.com", 150],
        ],
      },
    ],
  },
  {
    title: "Cloud Engineer Roadmap",
    slug: "cloud-engineer-roadmap",
    category: "DevOps",
    icon: "cloud",
    coverTint: "#3B82F6",
    difficulty: "INTERMEDIATE" as const,
    estimatedDuration: "4 months",
    description: "Networking, IAM, compute, storage and observability across AWS and Azure.",
    stages: [
      {
        title: "Cloud Foundations",
        description: "Concepts and the shared responsibility model.",
        topics: [
          ["Cloud concepts", "AWS Skill Builder", 120],
          ["Linux & networking", "Linux Journey", 180],
          ["IAM fundamentals", "aws.amazon.com", 120],
        ],
      },
      {
        title: "Core Services",
        description: "Compute, storage and databases.",
        topics: [
          ["EC2 & compute", "aws.amazon.com", 150],
          ["S3 & storage classes", "aws.amazon.com", 90],
          ["VPC networking", "aws.amazon.com", 180],
          ["RDS & DynamoDB", "aws.amazon.com", 150],
        ],
      },
      {
        title: "Operations",
        description: "Observability and cost control.",
        topics: [
          ["CloudWatch & logs", "aws.amazon.com", 120],
          ["Terraform IaC", "terraform.io", 180],
          ["Cost optimisation", "aws.amazon.com", 90],
        ],
      },
    ],
  },
];

/* ----------------------------- mock tests --------------------------- */

const MOCK_TESTS = [
  {
    title: "Aptitude Mock Test – Set 1",
    slug: "aptitude-mock-test-set-1",
    subject: "Aptitude",
    description:
      "Speed, accuracy and time arithmetic practice for campus placement aptitude rounds.",
    difficulty: "MEDIUM" as const,
    durationMinutes: 60,
    totalMarks: 100,
    questions: [
      {
        topic: "Speed & Distance",
        text: "A train 120 m long is moving at 72 km/h. How long does it take to cross a pole?",
        options: [
          ["5 seconds", false],
          ["6 seconds", true],
          ["8 seconds", false],
          ["10 seconds", false],
        ],
        explanation: "72 km/h = 20 m/s. Time = 120 / 20 = 6 seconds.",
      },
      {
        topic: "Speed & Distance",
        text: "A car covers 150 km in 2.5 hours. What is its average speed?",
        options: [
          ["50 km/h", false],
          ["55 km/h", false],
          ["60 km/h", true],
          ["65 km/h", false],
        ],
        explanation: "150 / 2.5 = 60 km/h.",
      },
      {
        topic: "Percentages",
        text: "If the price of a book increases from ₹200 to ₹250, what is the percentage increase?",
        options: [
          ["20%", false],
          ["25%", true],
          ["30%", false],
          ["50%", false],
        ],
        explanation: "(50 / 200) × 100 = 25%.",
      },
      {
        topic: "Percentages",
        text: "A student scored 45 out of 60. What percentage did they score?",
        options: [
          ["65%", false],
          ["70%", false],
          ["75%", true],
          ["80%", false],
        ],
        explanation: "(45 / 60) × 100 = 75%.",
      },
      {
        topic: "Profit & Loss",
        text: "An item bought for ₹800 is sold for ₹920. What is the profit percentage?",
        options: [
          ["12%", false],
          ["15%", true],
          ["18%", false],
          ["20%", false],
        ],
        explanation: "Profit = 120. (120 / 800) × 100 = 15%.",
      },
      {
        topic: "Profit & Loss",
        text: "A shopkeeper allows a 10% discount on a marked price of ₹500. What is the selling price?",
        options: [
          ["₹400", false],
          ["₹450", true],
          ["₹480", false],
          ["₹490", false],
        ],
        explanation: "Discount = 50, so SP = 450.",
      },
      {
        topic: "Time & Work",
        text: "A can complete a task in 12 days and B in 6 days. Working together, how long will they take?",
        options: [
          ["3 days", false],
          ["4 days", true],
          ["5 days", false],
          ["8 days", false],
        ],
        explanation: "1/12 + 1/6 = 3/12 = 1/4 → 4 days.",
      },
      {
        topic: "Time & Work",
        text: "If 5 workers build a wall in 10 days, how many days will 10 workers take?",
        options: [
          ["5 days", true],
          ["6 days", false],
          ["8 days", false],
          ["20 days", false],
        ],
        explanation: "Work is constant → 5 × 10 = 10 × x → x = 5 days.",
      },
      {
        topic: "Number System",
        text: "What is the largest number that divides 70 and 125 leaving remainders 5 and 8 respectively?",
        options: [
          ["13", true],
          ["17", false],
          ["25", false],
          ["31", false],
        ],
        explanation: "HCF of (70-5) and (125-8) = HCF(65, 117) = 13.",
      },
      {
        topic: "Number System",
        text: "What is the unit digit of 7^105?",
        options: [
          ["1", false],
          ["3", false],
          ["7", true],
          ["9", false],
        ],
        explanation: "Powers of 7 cycle every 4: 105 mod 4 = 1 → unit digit 7.",
      },
    ],
  },
  {
    title: "Technical Mock Test – Computer Networks",
    slug: "technical-mock-test-computer-networks",
    subject: "Technical",
    description: "Core computer networks concepts asked in VTU exams and placement interviews.",
    difficulty: "MEDIUM" as const,
    durationMinutes: 30,
    totalMarks: 40,
    questions: [
      {
        topic: "OSI Model",
        text: "Which OSI layer is responsible for end-to-end delivery of a complete message?",
        options: [
          ["Network layer", false],
          ["Transport layer", true],
          ["Session layer", false],
          ["Data link layer", false],
        ],
        explanation: "The transport layer provides process-to-process (end-to-end) delivery.",
      },
      {
        topic: "TCP/IP",
        text: "Which protocol is connection-oriented?",
        options: [
          ["UDP", false],
          ["IP", false],
          ["TCP", true],
          ["ICMP", false],
        ],
        explanation: "TCP establishes a connection using a three-way handshake.",
      },
      {
        topic: "IP Addressing",
        text: "What is the default subnet mask of a Class C IPv4 address?",
        options: [
          ["255.0.0.0", false],
          ["255.255.0.0", false],
          ["255.255.255.0", true],
          ["255.255.255.255", false],
        ],
        explanation: "Class C uses a /24 prefix → 255.255.255.0.",
      },
      {
        topic: "Routing",
        text: "Which device operates at the network layer and forwards packets between networks?",
        options: [
          ["Hub", false],
          ["Switch", false],
          ["Router", true],
          ["Repeater", false],
        ],
        explanation: "Routers make forwarding decisions using IP addresses.",
      },
      {
        topic: "DNS",
        text: "What does DNS translate?",
        options: [
          ["IP addresses to MAC addresses", false],
          ["Domain names to IP addresses", true],
          ["MAC to domain names", false],
          ["Ports to protocols", false],
        ],
        explanation: "DNS resolves human-readable domain names into IP addresses.",
      },
      {
        topic: "Security",
        text: "Which protocol provides secure encrypted communication over port 443?",
        options: [
          ["HTTP", false],
          ["FTP", false],
          ["HTTPS", true],
          ["SMTP", false],
        ],
        explanation: "HTTPS = HTTP over TLS, served on port 443.",
      },
    ],
  },
  {
    title: "Technical Mock Test – Operating Systems",
    slug: "technical-mock-test-operating-systems",
    subject: "Technical",
    description: "Scheduling, memory management and synchronisation fundamentals.",
    difficulty: "MEDIUM" as const,
    durationMinutes: 20,
    totalMarks: 30,
    questions: [
      {
        topic: "Scheduling",
        text: "Which CPU scheduling algorithm can cause starvation?",
        options: [
          ["Round Robin", false],
          ["First Come First Served", false],
          ["Priority scheduling", true],
          ["Shortest Job First", false],
        ],
        explanation: "Priority scheduling can starve low-priority processes.",
      },
      {
        topic: "Memory",
        text: "Which technique solves external fragmentation?",
        options: [
          ["Paging", true],
          ["Segmentation", false],
          ["Contiguous allocation", false],
          ["Static partitioning", false],
        ],
        explanation: "Paging removes external fragmentation by fixing frame size.",
      },
      {
        topic: "Concurrency",
        text: "A race condition occurs when…",
        options: [
          ["processes deadlock", false],
          ["multiple processes access shared data concurrently and the outcome depends on ordering", true],
          ["memory is full", false],
          ["a process waits forever", false],
        ],
        explanation: "Unsynchronised access to shared state produces order-dependent results.",
      },
      {
        topic: "Deadlock",
        text: "Which is NOT a necessary condition for deadlock?",
        options: [
          ["Mutual exclusion", false],
          ["Hold and wait", false],
          ["Preemption allowed", true],
          ["Circular wait", false],
        ],
        explanation: "Deadlock requires no preemption; preemption is a prevention strategy.",
      },
      {
        topic: "Scheduling",
        text: "Round Robin scheduling is most suitable for…",
        options: [
          ["batch systems", false],
          ["time-sharing systems", true],
          ["real-time hard systems", false],
          ["single-user systems", false],
        ],
        explanation: "Time slices give fair response times in interactive systems.",
      },
      {
        topic: "Memory",
        text: "The page fault rate is highest when…",
        options: [
          ["the working set fits in memory", false],
          ["thrashing occurs", true],
          ["the CPU is idle", false],
          ["TLB hit ratio is high", false],
        ],
        explanation: "Thrashing is continuous paging with almost no useful work.",
      },
    ],
  },
];

/* ---------------------------- opportunities ------------------------- */

const COMPANIES = [
  {
    name: "Microsoft",
    logoText: "MS",
    logoColor: "#00A4EF",
    website: "https://microsoft.com",
    about:
      "Microsoft enables digital transformation for the era of an intelligent cloud and edge.",
  },
  {
    name: "Amazon",
    logoText: "AZ",
    logoColor: "#FF9900",
    website: "https://amazon.jobs",
    about:
      "Amazon is guided by customer obsession and builds products at global scale.",
  },
  {
    name: "Google",
    logoText: "GO",
    logoColor: "#4285F4",
    website: "https://google.com/careers",
    about:
      "Google solves problems at scale with engineering rigour and user-first products.",
  },
  {
    name: "TCS",
    logoText: "TC",
    logoColor: "#1F3A93",
    website: "https://tcs.com/careers",
    about:
      "Tata Consultancy Services is a global leader in IT services, consulting and business solutions.",
  },
  {
    name: "Infosys",
    logoText: "IN",
    logoColor: "#007CC3",
    website: "https://infosys.com/careers",
    about:
      "Infosys navigates clients' digital transformation with next-generation services.",
  },
  {
    name: "Wipro",
    logoText: "WI",
    logoColor: "#341E6B",
    website: "https://wipro.com/careers",
    about:
      "Wipro delivers capabilities in cloud, analytics, AI and engineering services.",
  },
  {
    name: "Zoho",
    logoText: "ZO",
    logoColor: "#E42527",
    website: "https://zoho.com/careers",
    about: "Zoho builds a suite of business software products used by millions.",
  },
];

const OPPORTUNITIES = [
  {
    company: "Microsoft",
    title: "Software Engineer Intern",
    type: "INTERNSHIP" as const,
    location: "Bengaluru",
    mode: "HYBRID" as const,
    branches: ["CSE", "ISE", "ECE"],
    batch: 2026,
    skills: ["Data Structures", "Algorithms", "C++", "System Design"],
    stipend: 40000,
    duration: "3 – 6 months",
    days: 21,
    description:
      "Work with engineering teams to build scalable, reliable and high-performance applications used by millions of customers.",
    responsibilities: [
      "Design, develop and test software modules.",
      "Collaborate with cross-functional teams.",
      "Participate in code reviews and design discussions.",
    ],
    eligibility: [
      "B.E./B.Tech in CSE, ISE or ECE (2026 batch)",
      "CGPA 7.0 and above with no active backlogs",
      "Strong DSA and problem-solving skills",
    ],
    hiring: [
      "Online assessment",
      "Two technical interviews",
      "HR / manager interview",
    ],
  },
  {
    company: "Amazon",
    title: "SDE – New Grad",
    type: "JOB" as const,
    location: "Hyderabad",
    mode: "ONSITE" as const,
    branches: ["CSE", "ISE", "ECE", "EEE"],
    batch: 2026,
    skills: ["Java", "Distributed Systems", "AWS", "DSA"],
    min: 3200000,
    max: 4400000,
    days: 14,
    description:
      "Build distributed systems at Amazon scale with high availability and low latency requirements.",
    responsibilities: [
      "Own services end to end.",
      "Write production-quality Java code.",
      "Improve reliability and performance.",
    ],
    eligibility: [
      "2026 graduates from CSE/ISE/ECE/EEE",
      "Strong coding and object-oriented design",
      "No active backlogs",
    ],
    hiring: ["Online assessment", "Loop interviews (3)", "Bar raiser"],
  },
  {
    company: "Google",
    title: "Software Engineering Intern (Summer)",
    type: "INTERNSHIP" as const,
    location: "Remote",
    mode: "REMOTE" as const,
    branches: ["CSE", "ISE"],
    batch: 2027,
    skills: ["Algorithms", "Python", "Go", "Machine Learning"],
    stipend: 60000,
    duration: "10 – 12 weeks",
    days: 30,
    description:
      "Work on a core Google product with a dedicated host and mentor for the summer internship programme.",
    responsibilities: [
      "Deliver a scoped project.",
      "Write tested, reviewed code.",
      "Present results to the wider team.",
    ],
    eligibility: [
      "Pursuing B.E./B.Tech in CSE / ISE",
      "Strong fundamentals in algorithms",
      "Available full time for the internship",
    ],
    hiring: ["Resume screen", "Two 45-minute interviews", "Team match"],
  },
  {
    company: "TCS",
    title: "TCS Digital – Fresher",
    type: "JOB" as const,
    location: "Pan India",
    mode: "HYBRID" as const,
    branches: ["CSE", "ISE", "ECE", "EEE", "ME", "CIV"],
    batch: 2026,
    skills: ["Programming", "SQL", "Communication", "Cloud basics"],
    min: 700000,
    max: 900000,
    days: 12,
    description:
      "Join TCS Digital and work on cloud, AI and automation engagements for global clients.",
    responsibilities: [
      "Support digital delivery teams.",
      "Develop and test modules.",
      "Document solutions and processes.",
    ],
    eligibility: [
      "2026 batch, all core branches",
      "Minimum 60% throughout academics",
      "Willing to relocate",
    ],
    hiring: ["NQT", "Technical interview", "HR interview"],
  },
  {
    company: "Infosys",
    title: "Systems Engineer (Off-Campus Drive)",
    type: "OFF_CAMPUS" as const,
    location: "Mysuru / Pune",
    mode: "ONSITE" as const,
    branches: ["CSE", "ISE", "ECE", "EEE", "ME", "CIV"],
    batch: 2025,
    skills: ["Java", "DBMS", "Problem Solving"],
    min: 450000,
    max: 500000,
    days: 9,
    description:
      "Off-campus hiring for Systems Engineers across Infosys delivery units after Mysuru training.",
    responsibilities: [
      "Build and maintain enterprise applications.",
      "Collaborate with global teams.",
      "Follow quality and delivery standards.",
    ],
    eligibility: [
      "2025 passed-out graduates",
      "More than 60% in X, XII and graduation",
      "No pending backlogs",
    ],
    hiring: ["Online test", "Interview"],
  },
  {
    company: "Wipro",
    title: "Project Engineer",
    type: "JOB" as const,
    location: "Bengaluru",
    mode: "HYBRID" as const,
    branches: ["CSE", "ISE", "ECE", "EEE", "ME", "CIV"],
    batch: 2026,
    skills: ["Linux", "Networking", "Scripting", "Cloud"],
    min: 350000,
    max: 420000,
    days: 18,
    description:
      "Deliver infrastructure and application services for Wipro's global clients.",
    responsibilities: [
      "Monitor and resolve incidents.",
      "Automate repetitive operations.",
      "Document runbooks.",
    ],
    eligibility: [
      "2026 batch graduates",
      "Good communication skills",
      "Basic knowledge of Linux and networking",
    ],
    hiring: ["Written test", "Technical + HR interview"],
  },
  {
    company: "Zoho",
    title: "Member Technical Staff (Fresher)",
    type: "JOB" as const,
    location: "Chennai",
    mode: "ONSITE" as const,
    branches: ["CSE", "ISE"],
    batch: 2026,
    skills: ["C", "C++", "Java", "Data Structures", "Problem Solving"],
    min: 600000,
    max: 800000,
    days: 25,
    description:
      "Build product features end to end inside Zoho's product engineering teams.",
    responsibilities: [
      "Design and implement product modules.",
      "Own quality with tests.",
      "Iterate on customer feedback.",
    ],
    eligibility: [
      "B.E./B.Tech CSE/ISE 2026",
      "Excellent programming fundamentals",
      "No arrears",
    ],
    hiring: ["Coding round", "Technical interviews", "HR"],
  },
  {
    company: "Amazon",
    title: "Data Analyst Intern",
    type: "INTERNSHIP" as const,
    location: "Bengaluru",
    mode: "HYBRID" as const,
    branches: ["CSE", "ISE", "ECE"],
    batch: 2027,
    skills: ["SQL", "Python", "Excel", "Tableau"],
    stipend: 35000,
    duration: "2 – 6 months",
    days: 16,
    description:
      "Support analytics for Amazon's retail and operations teams using SQL and BI tooling.",
    responsibilities: [
      "Build dashboards and reports.",
      "Analyse large datasets.",
      "Present insights to stakeholders.",
    ],
    eligibility: [
      "2027 batch students",
      "Strong SQL skills",
      "Familiarity with Python or R",
    ],
    hiring: ["Online test", "Case study", "Interview"],
  },
  {
    company: "Microsoft",
    title: "Support Engineer (Off-Campus)",
    type: "OFF_CAMPUS" as const,
    location: "Bengaluru",
    mode: "ONSITE" as const,
    branches: ["CSE", "ISE", "ECE", "EEE"],
    batch: 2025,
    skills: ["Networking", "Windows Server", "Azure", "Communication"],
    min: 600000,
    max: 750000,
    days: 7,
    description:
      "Provide technical support and escalation management for Microsoft cloud customers.",
    responsibilities: [
      "Diagnose and resolve customer incidents.",
      "Collaborate with engineering teams.",
      "Maintain SLA compliance.",
    ],
    eligibility: [
      "2025 graduates",
      "Good troubleshooting skills",
      "Willing to work in shifts",
    ],
    hiring: ["Assessment", "Technical interview", "HR"],
  },
  {
    company: "Google",
    title: "STEP Intern (Software)",
    type: "INTERNSHIP" as const,
    location: "Hyderabad",
    mode: "HYBRID" as const,
    branches: ["CSE", "ISE", "ECE"],
    batch: 2027,
    skills: ["Python", "Data Structures", "Git"],
    stipend: 50000,
    duration: "10 – 12 weeks",
    days: 28,
    description:
      "The Student Training in Engineering Program (STEP) internship for second-year students.",
    responsibilities: [
      "Complete a software project with a mentor.",
      "Attend technical training sessions.",
      "Present your work.",
    ],
    eligibility: [
      "Second-year students (2027 batch)",
      "Completed DSA coursework",
      "Available for the full term",
    ],
    hiring: ["Resume screen", "Two interviews"],
  },
  {
    company: "Infosys",
    title: "Digital Specialist Engineer",
    type: "JOB" as const,
    location: "Pune",
    mode: "HYBRID" as const,
    branches: ["CSE", "ISE"],
    batch: 2026,
    skills: ["Java", "Spring Boot", "Microservices", "SQL"],
    min: 900000,
    max: 1100000,
    days: 20,
    description:
      "Build microservices and full stack solutions for Infosys digital clients.",
    responsibilities: [
      "Develop backend services.",
      "Write unit and integration tests.",
      "Participate in agile ceremonies.",
    ],
    eligibility: [
      "2026 batch CSE/ISE",
      "Knowledge of Java or .NET",
      "Good problem-solving ability",
    ],
    hiring: ["HackWithInfy", "Interview"],
  },
  {
    company: "Wipro",
    title: "Cloud Intern",
    type: "INTERNSHIP" as const,
    location: "Remote",
    mode: "REMOTE" as const,
    branches: ["CSE", "ISE", "ECE"],
    batch: 2027,
    skills: ["AWS", "Linux", "Docker", "Python"],
    stipend: 25000,
    duration: "6 months",
    days: 11,
    description:
      "Assist cloud engineering teams with automation, monitoring and deployment tasks.",
    responsibilities: [
      "Automate infrastructure tasks.",
      "Monitor cloud resources.",
      "Document processes.",
    ],
    eligibility: [
      "2027 batch students",
      "Basic cloud knowledge",
      "Familiar with Linux",
    ],
    hiring: ["Online test", "Interview"],
  },
];

/* ------------------------------- users ------------------------------ */

const ADMIN = {
  fullName: "Priya Nair",
  email: "admin@engineerprep.in",
  password: "Admin@123",
  role: "ADMIN" as const,
  collegeName: "EngineerPrep India HQ",
  graduationYear: 2018,
};

const STUDENTS = [
  {
    fullName: "Arun Kumar",
    email: "arun@engineerprep.in",
    password: "Student@123",
    collegeName: "Government Engineering College",
    branchCode: "CSE",
    semester: 5,
    graduationYear: 2027,
  },
  {
    fullName: "Divya Rao",
    email: "divya@engineerprep.in",
    password: "Student@123",
    collegeName: "BMS Institute of Technology",
    branchCode: "ISE",
    semester: 5,
    graduationYear: 2027,
  },
  {
    fullName: "Karthik Shetty",
    email: "karthik@engineerprep.in",
    password: "Student@123",
    collegeName: "NIE Mysuru",
    branchCode: "ECE",
    semester: 6,
    graduationYear: 2026,
  },
  {
    fullName: "Sneha Patil",
    email: "sneha@engineerprep.in",
    password: "Student@123",
    collegeName: "Siddaganga Institute of Technology",
    branchCode: "CSE",
    semester: 7,
    graduationYear: 2026,
  },
  {
    fullName: "Rahul Verma",
    email: "rahul@engineerprep.in",
    password: "Student@123",
    collegeName: "Dayananda Sagar College of Engineering",
    branchCode: "EEE",
    semester: 5,
    graduationYear: 2027,
  },
];

/* ------------------------------- seed ------------------------------- */

async function seed() {
  console.log("⏳ Truncating existing data…");
  await db.execute(sql`
    TRUNCATE TABLE
      refresh_tokens, password_reset_tokens, email_verification_tokens, audit_logs,
      downloads, dsa_progress, dsa_solutions, dsa_problems, dsa_patterns, dsa_sheets,
      roadmap_progress, roadmap_topics, roadmap_stages, roadmaps,
      test_responses, test_attempts, question_options, questions, mock_tests,
      saved_opportunities, job_applications, opportunities, companies,
      bookmarks, notifications, notification_preferences, learning_activities,
      student_streaks, import_jobs, automation_executions, automation_rules,
      scheduled_tasks, notification_templates, notification_deliveries,
      notification_outbox, automation_settings, resources, vtu_updates, subjects,
      semesters, schemes, branches, users
    RESTART IDENTITY CASCADE
  `);

  /* Branches / schemes / semesters */
  console.log("🌱 Seeding academic metadata…");
  const branchRows = await db
    .insert(branches)
    .values(BRANCHES.map((b) => ({ id: id(), code: b.code, name: b.name })))
    .returning();
  const schemeRows = await db
    .insert(schemes)
    .values(SCHEMES.map((s) => ({ id: id(), name: s })))
    .returning();
  const semesterRows = await db
    .insert(semesters)
    .values(
      Array.from({ length: 8 }, (_, i) => ({
        id: id(),
        number: i + 1,
        label: `Semester ${i + 1}`,
      })),
    )
    .returning();

  const semByNumber = new Map(semesterRows.map((s) => [s.number, s]));
  const scheme2022 = schemeRows.find((s) => s.name === "2022")!;

  /* Subjects + resources */
  console.log("📚 Seeding subjects and VTU resources…");
  const subjectValues: Array<typeof subjects.$inferInsert> = [];
  const resourceValues: Array<typeof resources.$inferInsert> = [];

  let subjectCounter = 0;
  for (const branch of BRANCHES) {
    const branchRow = branchRows.find((b) => b.code === branch.code)!;
    for (const semNumber of [3, 4, 5, 6]) {
      const sem = semByNumber.get(semNumber)!;
      const pool =
        BRANCH_SUBJECTS[branch.code]?.[semNumber] ??
        SUBJECTS_BY_SEM[semNumber];
      pool.slice(0, 5).forEach((name, idx) => {
        subjectCounter += 1;
        const subjectId = id();
        subjectValues.push({
          id: subjectId,
          name,
          code: `22${branch.code}${semNumber}${idx + 1}`,
          branchId: branchRow.id,
          semesterId: sem.id,
          schemeId: scheme2022.id,
          credits: 3 + (idx % 2),
        });

        const noteFile = pick(DEMO_FILES, subjectCounter);
        const paperFile = pick(DEMO_FILES, subjectCounter + 1);
        const syllabusFile = pick(DEMO_FILES, subjectCounter + 2);

        resourceValues.push({
          id: id(),
          title: `${name} — Module ${1 + (subjectCounter % 3)} Notes`,
          description: `Handwritten and typed notes covering all modules of ${name} as per the VTU syllabus.`,
          resourceType: "NOTES",
          subjectId,
          moduleNumber: 1 + (subjectCounter % 5),
          fileName: `${branch.code}-${semNumber}-${idx + 1}-module-notes.pdf`,
          fileUrl: noteFile.url,
          fileSize: noteFile.size,
          status: "PUBLISHED",
          downloadCount: 120 + (subjectCounter % 400),
        });
        resourceValues.push({
          id: id(),
          title: `${name} — Previous Year Question Papers (2020-2025)`,
          description: "Solved and unsolved previous year question papers with model answers.",
          resourceType: "QUESTION_PAPER",
          subjectId,
          moduleNumber: null,
          fileName: `${branch.code}-${semNumber}-${idx + 1}-question-papers.pdf`,
          fileUrl: paperFile.url,
          fileSize: paperFile.size,
          status: "PUBLISHED",
          downloadCount: 80 + (subjectCounter % 260),
        });
        resourceValues.push({
          id: id(),
          title: `${name} — Syllabus & Curriculum`,
          description: "Official VTU syllabus document with credits and course outcomes.",
          resourceType: "SYLLABUS",
          subjectId,
          moduleNumber: null,
          fileName: `${branch.code}-${semNumber}-${idx + 1}-syllabus.pdf`,
          fileUrl: syllabusFile.url,
          fileSize: syllabusFile.size,
          status: "PUBLISHED",
          downloadCount: 40 + (subjectCounter % 120),
        });
        if (semNumber >= 5) {
          resourceValues.push({
            id: id(),
            title: `${name} — Lab Manual`,
            description: "Complete lab manual with programs, outputs and viva questions.",
            resourceType: "LAB_MANUAL",
            subjectId,
            moduleNumber: null,
            fileName: `${branch.code}-${semNumber}-${idx + 1}-lab-manual.pdf`,
            fileUrl: DEMO_FILES[3].url,
            fileSize: DEMO_FILES[3].size,
            status: "PUBLISHED",
            downloadCount: 30 + (subjectCounter % 90),
          });
        }
        if (semNumber >= 4) {
          resourceValues.push({
            id: id(),
            title: `${name} — Assignment Questions`,
            description: "Internal assessment assignment questions with solutions.",
            resourceType: "ASSIGNMENT",
            subjectId,
            moduleNumber: 1 + (subjectCounter % 5),
            fileName: `${branch.code}-${semNumber}-${idx + 1}-assignment.pdf`,
            fileUrl: DEMO_FILES[4].url,
            fileSize: DEMO_FILES[4].size,
            status: "PUBLISHED",
            downloadCount: 15 + (subjectCounter % 70),
          });
        }
      });
    }
  }

  for (let i = 0; i < subjectValues.length; i += 60) {
    await db.insert(subjects).values(subjectValues.slice(i, i + 60));
  }
  for (let i = 0; i < resourceValues.length; i += 60) {
    await db.insert(resources).values(resourceValues.slice(i, i + 60));
  }
  console.log(`   → ${subjectValues.length} subjects, ${resourceValues.length} resources`);

  /* Users */
  console.log("👤 Seeding users…");
  const bcrypt = await import("bcryptjs");
  const adminRow = await db
    .insert(users)
    .values({
      id: id(),
      fullName: ADMIN.fullName,
      email: ADMIN.email,
      phone: "+91 90000 00001",
      passwordHash: await bcrypt.hash(ADMIN.password, 10),
      role: ADMIN.role,
      collegeName: ADMIN.collegeName,
      graduationYear: ADMIN.graduationYear,
      emailVerified: true,
    })
    .returning();

  const studentRows: Array<{ id: string; fullName: string; email: string; collegeName: string | null }> = [];
  for (const s of STUDENTS) {
    const branchRow = branchRows.find((b) => b.code === s.branchCode)!;
    const sem = semByNumber.get(s.semester)!;
    const [row] = await db
      .insert(users)
      .values({
        id: id(),
        fullName: s.fullName,
        email: s.email,
        phone: `+91 90000 0001${studentRows.length + 2}`,
        passwordHash: await bcrypt.hash(s.password, 10),
        role: "STUDENT",
        collegeName: s.collegeName,
        branchId: branchRow.id,
        semesterId: sem.id,
        graduationYear: s.graduationYear,
        emailVerified: true,
      })
      .returning();
    studentRows.push(row);
  }

  const arun = studentRows[0];
  const divya = studentRows[1];

  /* VTU updates */
  console.log("📢 Seeding VTU updates…");
  await db.insert(vtuUpdates).values([
    {
      id: id(),
      title: "VTU B.E. Semester End Examination Time Table – Dec 2024",
      category: "Examination",
      summary:
        "The final time table for the December 2024 semester end examinations has been released for all schemes.",
      publishedAt: new Date(now - 2 * day),
      fileUrl: DEMO_FILES[1].url,
      fileSize: "PDF 1.2 MB",
      createdBy: adminRow[0].id,
    },
    {
      id: id(),
      title: "Registration for Revaluation Results – July 2024",
      category: "Revaluation",
      summary:
        "Students can apply for revaluation and photocopies of answer scripts until the notified last date.",
      publishedAt: new Date(now - 6 * day),
      fileUrl: DEMO_FILES[0].url,
      fileSize: "PDF 650 KB",
      createdBy: adminRow[0].id,
    },
    {
      id: id(),
      title: "Academic Calendar for Even Semester 2024-25",
      category: "Circular",
      summary:
        "Important dates for the even semester including commencement of classes, IAs and examinations.",
      publishedAt: new Date(now - 11 * day),
      fileUrl: DEMO_FILES[2].url,
      fileSize: "PDF 1.5 MB",
      createdBy: adminRow[0].id,
    },
    {
      id: id(),
      title: "Notice: Makeup Examination Registration",
      category: "Examination",
      summary:
        "Registration portal for the upcoming makeup examinations is now open for eligible students.",
      publishedAt: new Date(now - 15 * day),
      fileUrl: DEMO_FILES[4].url,
      fileSize: "PDF 320 KB",
      createdBy: adminRow[0].id,
    },
  ]);

  /* DSA sheets, patterns, problems */
  console.log("🧠 Seeding DSA sheets, patterns and problems…");
  const sheetRows = await db
    .insert(dsaSheets)
    .values(
      SHEETS.map((s) => ({
        id: id(),
        title: s.title,
        author: s.author,
        slug: s.slug,
        description: s.description,
        coverTint: s.coverTint,
        difficulty: s.difficulty,
        totalProblems: 0,
      })),
    )
    .returning();

  const patternRows = await db
    .insert(dsaPatterns)
    .values(
      PATTERNS.map((p) => ({
        id: id(),
        name: p.name,
        slug: p.slug,
        summary: p.summary,
        about: p.about,
        whenToUse: p.whenToUse,
        templates: patternTemplates,
        icon: p.icon,
        tint: p.tint,
      })),
    )
    .returning();

  const patternBySlug = new Map(patternRows.map((p) => [p.slug, p]));
  const problemValues: Array<typeof dsaProblems.$inferInsert> = [];
  const solutionValues: Array<typeof dsaSolutions.$inferInsert> = [];
  let orderIndex = 0;
  PATTERNS.forEach((pattern) => {
    const patternRow = patternBySlug.get(pattern.slug)!;
    pattern.problems.forEach((problem, i) => {
      orderIndex += 1;
      const problemId = id();
      const sheetRow = sheetRows[i % sheetRows.length];
      problemValues.push({
        id: problemId,
        title: problem.title,
        slug: problem.slug,
        statement: problem.statement,
        examples: problem.examples,
        constraints: problem.constraints,
        hints: problem.hints,
        editorial: problem.editorial,
        practiceUrl: problem.practiceUrl,
        difficulty: problem.difficulty,
        orderIndex,
        sheetId: sheetRow.id,
        patternId: patternRow.id,
      });
      problem.solutions.forEach((sol) => {
        solutionValues.push({
          id: id(),
          problemId,
          language: sol.language,
          code: sol.code,
          complexity: sol.complexity,
        });
      });
    });
  });
  await db.insert(dsaProblems).values(problemValues);
  await db.insert(dsaSolutions).values(solutionValues);

  // Update sheet problem counts
  for (const sheet of sheetRows) {
    const count = problemValues.filter((p) => p.sheetId === sheet.id).length;
    await db
      .update(dsaSheets)
      .set({ totalProblems: Math.max(count, sheetRows.indexOf(sheet) === 0 ? 455 : 0) })
      .where(eq(dsaSheets.id, sheet.id));
  }

  /* Roadmaps */
  console.log("🗺️  Seeding roadmaps…");
  for (const roadmap of ROADMAPS) {
    const roadmapId = id();
    let stepCount = 0;
    await db.insert(roadmaps).values({
      id: roadmapId,
      title: roadmap.title,
      slug: roadmap.slug,
      category: roadmap.category,
      icon: roadmap.icon,
      coverTint: roadmap.coverTint,
      difficulty: roadmap.difficulty,
      estimatedDuration: roadmap.estimatedDuration,
      description: roadmap.description,
      stepCount: 0,
    });
    for (const [sIndex, stage] of roadmap.stages.entries()) {
      const stageId = id();
      await db.insert(roadmapStages).values({
        id: stageId,
        roadmapId,
        title: stage.title,
        description: stage.description,
        orderIndex: sIndex + 1,
      });
      const topics = stage.topics.map(([title, resourceLabel, minutes], tIndex) => ({
        id: id(),
        stageId,
        title: title as string,
        resourceLabel: resourceLabel as string,
        estimatedMinutes: minutes as number,
        orderIndex: tIndex + 1,
      }));
      await db.insert(roadmapTopics).values(topics);
      stepCount += topics.length;
    }
    await db
      .update(roadmaps)
      .set({ stepCount })
      .where(eq(roadmaps.id, roadmapId));
  }

  /* Mock tests */
  console.log("📝 Seeding mock tests…");
  for (const test of MOCK_TESTS) {
    const testId = id();
    await db.insert(mockTests).values({
      id: testId,
      title: test.title,
      slug: test.slug,
      subject: test.subject,
      description: test.description,
      difficulty: test.difficulty,
      durationMinutes: test.durationMinutes,
      totalMarks: test.totalMarks,
      isPublished: true,
    });
    for (const [qIndex, q] of test.questions.entries()) {
      const questionId = id();
      await db.insert(questions).values({
        id: questionId,
        testId,
        topic: q.topic,
        text: q.text,
        explanation: q.explanation,
        marks: 2,
        negativeMarks: "0.5",
        orderIndex: qIndex + 1,
      });
      await db.insert(questionOptions).values(
        q.options.map(([text, isCorrect], oIndex) => ({
          id: id(),
          questionId,
          label: String.fromCharCode(65 + oIndex),
          text: text as string,
          isCorrect: Boolean(isCorrect),
        })),
      );
    }
  }

  /* Companies + opportunities */
  console.log("💼 Seeding companies and opportunities…");
  const companyRows = await db
    .insert(companies)
    .values(
      COMPANIES.map((c) => ({
        id: id(),
        name: c.name,
        logoText: c.logoText,
        logoColor: c.logoColor,
        website: c.website,
        about: c.about,
      })),
    )
    .returning();

  for (const opp of OPPORTUNITIES) {
    const company = companyRows.find((c) => c.name === opp.company)!;
    await db.insert(opportunities).values({
      id: id(),
      companyId: company.id,
      title: opp.title,
      description: opp.description,
      responsibilities: opp.responsibilities,
      eligibility: opp.eligibility,
      hiringProcess: opp.hiring,
      opportunityType: opp.type,
      location: opp.location,
      workMode: opp.mode,
      branchEligibility: opp.branches,
      graduationBatch: opp.batch,
      requiredSkills: opp.skills,
      salaryMin: opp.min ?? null,
      salaryMax: opp.max ?? null,
      stipend: opp.stipend ?? null,
      duration: opp.duration ?? null,
      applicationDeadline: new Date(now + opp.days * day),
      applicationUrl: `/jobs/apply?demo=1`,
      status: "OPEN",
      postedAt: new Date(now - Math.floor(Math.random() * 10) * day),
    });
  }

  const opportunityRows = await db
    .select({ id: opportunities.id, title: opportunities.title })
    .from(opportunities);

  /* Student activity: progress, bookmarks, applications, notifications */
  console.log("📈 Seeding student activity…");
  const twoPointer = patternBySlug.get("two-pointers")!;
  const slidingWindow = patternBySlug.get("sliding-window")!;
  const progressProblems = problemValues.filter(
    (p) => p.patternId === twoPointer.id || p.patternId === slidingWindow.id,
  );
  for (const problem of progressProblems.slice(0, 3)) {
    await db.insert(dsaProgress).values({
      id: id(),
      userId: arun.id,
      problemId: problem.id as string,
      sheetId: problem.sheetId ?? null,
      completed: true,
      solvedAt: new Date(now - Math.floor(Math.random() * 6) * day),
    });
  }

  // Roadmap progress for Arun (Full Stack)
  const [fullStack] = await db
    .select()
    .from(roadmaps)
    .where(eq(roadmaps.slug, "full-stack-developer-roadmap"))
    .limit(1);
  const fsStages = await db
    .select()
    .from(roadmapStages)
    .where(eq(roadmapStages.roadmapId, fullStack.id))
    .orderBy(roadmapStages.orderIndex);
  const fsTopics = await db
    .select()
    .from(roadmapTopics)
    .where(eq(roadmapTopics.stageId, fsStages[0].id));
  for (const topic of fsTopics.slice(0, 3)) {
    await db.insert(roadmapProgress).values({
      id: id(),
      userId: arun.id,
      roadmapId: fullStack.id,
      topicId: topic.id,
      completed: true,
      completedAt: new Date(now - 2 * day),
    });
  }

  // Bookmarks
  const bookmarkedResources = await db.select({ id: resources.id }).from(resources).limit(4);
  for (const r of bookmarkedResources) {
    await db.insert(bookmarks).values({
      id: id(),
      userId: arun.id,
      kind: "RESOURCE",
      refId: r.id,
    });
  }

  // Saved opportunities + applications
  const savedOpp = opportunityRows[0];
  const appliedOpp = opportunityRows[3];
  await db.insert(savedOpportunities).values({
    id: id(),
    userId: arun.id,
    opportunityId: savedOpp.id,
  });
  await db.insert(jobApplications).values({
    id: id(),
    userId: arun.id,
    opportunityId: appliedOpp.id,
    status: "UNDER_REVIEW",
    fullName: arun.fullName,
    email: arun.email,
    phone: "+91 90000 00002",
    college: arun.collegeName,
    branch: "CSE",
    graduationYear: 2027,
    resumeUrl: "/demo-files/sample-resume.pdf",
    portfolioUrl: "https://github.com/arun",
    appliedAt: new Date(now - 4 * day),
  });

  // Downloads
  const downloadResources = await db.select({ id: resources.id }).from(resources).limit(6);
  for (const r of downloadResources) {
    await db.insert(downloads).values({
      id: id(),
      userId: arun.id,
      resourceId: r.id,
      downloadedAt: new Date(now - Math.floor(Math.random() * 9) * day),
    });
  }

  // Notifications
  await db.insert(notifications).values([
    {
      id: id(),
      userId: arun.id,
      type: "VTU_UPDATE",
      title: "New VTU time table released",
      body: "The December semester end examination time table is now available.",
      linkUrl: "/vtu/updates",
      isRead: false,
      createdAt: new Date(now - 2 * 3600_000),
    },
    {
      id: id(),
      userId: arun.id,
      type: "DEADLINE_REMINDER",
      title: "Application deadline in 12 days",
      body: "TCS Digital – Fresher closes soon. Apply before you miss it.",
      linkUrl: `/jobs/${appliedOpp.id}`,
      isRead: false,
      createdAt: new Date(now - 5 * 3600_000),
    },
    {
      id: id(),
      userId: arun.id,
      type: "MOCK_TEST_REMINDER",
      title: "Upcoming mock test: Aptitude Set 1",
      body: "Scheduled for Nov 07. Attempt a full-length test before then.",
      linkUrl: "/placements/mock-tests",
      isRead: false,
      createdAt: new Date(now - 9 * 3600_000),
    },
    {
      id: id(),
      userId: arun.id,
      type: "APPLICATION_UPDATE",
      title: "Application moved to Under Review",
      body: `${appliedOpp.title} — your application is under review.`,
      linkUrl: "/jobs/applications",
      isRead: true,
      createdAt: new Date(now - 2 * day),
    },
    {
      id: id(),
      userId: arun.id,
      type: "WEEKLY_REPORT",
      title: "Your weekly progress report is ready",
      body: "You solved 3 problems and completed 3 roadmap topics this week.",
      linkUrl: "/my-progress",
      isRead: true,
      createdAt: new Date(now - 3 * day),
    },
  ]);

  // Notification preferences + streak + activity
  await db.insert(notificationPreferences).values({
    id: id(),
    userId: arun.id,
    emailNotifications: false,
    timezone: "Asia/Kolkata",
    reminderTime: "19:00",
    digestFrequency: "WEEKLY",
  });
  await db.insert(notificationPreferences).values({
    id: id(),
    userId: divya.id,
    emailNotifications: false,
  });

  await db.insert(studentStreaks).values({
    id: id(),
    userId: arun.id,
    currentStreak: 12,
    longestStreak: 18,
    lastActiveDate: new Date(now - 1 * day),
    dailyGoal: 3,
  });
  await db.insert(studentStreaks).values({
    id: id(),
    userId: divya.id,
    currentStreak: 4,
    longestStreak: 6,
    lastActiveDate: new Date(now - 1 * day),
    dailyGoal: 2,
  });

  const activities: Array<typeof learningActivities.$inferInsert> = [];
  const activitySeed = [
    ["DSA_SOLVED", "Solved “Two Sum II – Input Array Is Sorted”", "Two Pointers pattern", 10, 2],
    ["DSA_SOLVED", "Solved “Container With Most Water”", "Two Pointers pattern", 15, 3],
    ["ROADMAP_TOPIC", "Completed “React fundamentals & hooks”", "Full Stack Developer Roadmap", 20, 4],
    ["RESOURCE_DOWNLOAD", "Downloaded DBMS Module 3 Notes", "VTU resource", 5, 5],
    ["TEST_ATTEMPT", "Attempted Aptitude Mock Test – Set 1", "Mock test", 25, 6],
    ["JOB_APPLIED", "Applied to TCS Digital – Fresher", "Jobs & Internships", 15, 7],
  ] as const;
  for (const [type, title, detail, points, ago] of activitySeed) {
    activities.push({
      id: id(),
      userId: arun.id,
      activityType: type,
      title,
      detail,
      points,
      occurredAt: new Date(now - ago * 3600_000),
    });
  }
  await db.insert(learningActivities).values(activities);

  /* Automation engine */
  console.log("⚙️  Seeding automation rules…");
  const rules = [
    {
      key: "vtu-update-broadcast",
      name: "VTU Update Broadcast",
      description: "Notify eligible students when new VTU content is published.",
      category: "VTU",
      cron: "0 9 * * *",
      queue: "vtu-update-queue",
    },
    {
      key: "job-alert-matcher",
      name: "Job Alert Matcher",
      description: "Match new opportunities with student branch, batch and preferences.",
      category: "Jobs",
      cron: "0 */4 * * *",
      queue: "job-alert-queue",
    },
    {
      key: "deadline-reminders",
      name: "Deadline Reminders",
      description: "Send reminders 7, 3 and 1 day before an application deadline.",
      category: "Jobs",
      cron: "0 8 * * *",
      queue: "deadline-reminder-queue",
    },
    {
      key: "learning-reminders",
      name: "Learning Reminders",
      description: "Nudge students about incomplete DSA sheets and roadmap topics.",
      category: "Learning",
      cron: "0 19 * * *",
      queue: "learning-reminder-queue",
    },
    {
      key: "streak-tracker",
      name: "Learning Streak Tracker",
      description: "Update daily streaks and milestone notifications.",
      category: "Learning",
      cron: "0 23 * * *",
      queue: "streak-queue",
    },
    {
      key: "weekly-report",
      name: "Weekly Progress Report",
      description: "Generate a weekly progress digest for every student.",
      category: "Learning",
      cron: "0 18 * * 0",
      queue: "weekly-report-queue",
    },
    {
      key: "content-publishing",
      name: "Scheduled Content Publishing",
      description: "Publish draft resources and mock tests at the scheduled time.",
      category: "Admin",
      cron: "0 6 * * *",
      queue: "content-publishing-queue",
    },
    {
      key: "bulk-import-processor",
      name: "Bulk Import Processor",
      description: "Validate and import uploaded CSV / XLSX / JSON content files.",
      category: "Admin",
      cron: "*/30 * * * *",
      queue: "bulk-import-queue",
    },
    {
      key: "expired-opportunity-cleanup",
      name: "Expired Opportunity Cleanup",
      description: "Expire opportunities past their application deadline.",
      category: "Admin",
      cron: "0 1 * * *",
      queue: "cleanup-queue",
    },
    {
      key: "email-digest",
      name: "Email Digest Dispatcher",
      description: "Send email digests to students who opted in.",
      category: "Notifications",
      cron: "0 7 * * *",
      queue: "email-queue",
    },
  ];

  const ruleRows = await db
    .insert(automationRules)
    .values(
      rules.map((r) => ({
        id: id(),
        key: r.key,
        name: r.name,
        description: r.description,
        category: r.category,
        cronExpression: r.cron,
        queueName: r.queue,
        status: "ACTIVE" as const,
        idempotencyKey: `${r.key}-${new Date().toISOString().slice(0, 10)}`,
        lastExecutedAt: new Date(now - Math.floor(Math.random() * 8) * 3600_000),
        nextExecutionAt: new Date(now + Math.floor(Math.random() * 12) * 3600_000),
      })),
    )
    .returning();

  await db.insert(scheduledTasks).values([
    {
      id: id(),
      name: "Deadline reminder sweep",
      queueName: "deadline-reminder-queue",
      cronExpression: "0 8 * * *",
      payload: { windows: [7, 3, 1] },
      lastRunAt: new Date(now - 3600_000),
      nextRunAt: new Date(now + 6 * 3600_000),
    },
    {
      id: id(),
      name: "Weekly analytics digest",
      queueName: "weekly-report-queue",
      cronExpression: "0 18 * * 0",
      payload: { channel: "IN_APP" },
      lastRunAt: new Date(now - 4 * day),
      nextRunAt: new Date(now + 3 * day),
    },
  ]);

  await db.insert(notificationTemplates).values([
    {
      id: id(),
      key: "vtu-update",
      channel: "IN_APP",
      subject: "New VTU update: {{title}}",
      body: "A new VTU update has been published for {{branch}} semester {{semester}}.",
      variables: ["title", "branch", "semester"],
    },
    {
      id: id(),
      key: "job-alert",
      channel: "IN_APP",
      subject: "New opportunity: {{title}} at {{company}}",
      body: "A new {{type}} matching your branch and batch has been posted.",
      variables: ["title", "company", "type"],
    },
    {
      id: id(),
      key: "deadline-reminder",
      channel: "IN_APP",
      subject: "Deadline in {{days}} days: {{title}}",
      body: "Applications for {{title}} close soon.",
      variables: ["days", "title"],
    },
  ]);

  await db.insert(automationExecutions).values([
    {
      id: id(),
      ruleId: ruleRows[0].id,
      status: "SUCCESS",
      triggerSource: "SCHEDULE",
      attempts: 1,
      message: "4 students notified",
      result: { notified: 4 },
      startedAt: new Date(now - 3600_000),
      finishedAt: new Date(now - 3599_000),
      createdAt: new Date(now - 3600_000),
    },
    {
      id: id(),
      ruleId: ruleRows[2].id,
      status: "SUCCESS",
      triggerSource: "SCHEDULE",
      attempts: 1,
      message: "3 reminders queued",
      result: { reminders: 3 },
      startedAt: new Date(now - 2 * 3600_000),
      finishedAt: new Date(now - 2 * 3600_000 + 4000),
      createdAt: new Date(now - 2 * 3600_000),
    },
    {
      id: id(),
      ruleId: ruleRows[8].id,
      status: "FAILED",
      triggerSource: "SCHEDULE",
      attempts: 2,
      message: "Transient connection error — retried successfully",
      result: { expired: 0 },
      startedAt: new Date(now - 26 * 3600_000),
      finishedAt: new Date(now - 26 * 3600_000 + 12000),
      createdAt: new Date(now - 26 * 3600_000),
    },
    {
      id: id(),
      ruleId: ruleRows[9].id,
      status: "SKIPPED",
      triggerSource: "SCHEDULE",
      attempts: 0,
      message: "SMTP credentials not configured",
      result: {},
      startedAt: new Date(now - 30 * 3600_000),
      finishedAt: new Date(now - 30 * 3600_000),
      createdAt: new Date(now - 30 * 3600_000),
    },
  ]);

  await db.insert(importJobs).values([
    {
      id: id(),
      category: "DSA Problems",
      fileName: "dsa-problems-batch-01.csv",
      fileSize: "CSV 84 KB",
      status: "COMPLETED",
      totalRows: 20,
      validRows: 20,
      invalidRows: 0,
      importedRows: 20,
      preview: [{ row: 1, title: "Two Sum II", difficulty: "EASY", pattern: "Two Pointers" }],
      errors: [],
      createdBy: adminRow[0].id,
      createdAt: new Date(now - 2 * day),
      completedAt: new Date(now - 2 * day + 90000),
    },
    {
      id: id(),
      category: "Jobs/Internships",
      fileName: "off-campus-drives.json",
      fileSize: "JSON 12 KB",
      status: "FAILED",
      totalRows: 8,
      validRows: 5,
      invalidRows: 3,
      importedRows: 0,
      preview: [],
      errors: [
        { row: 3, field: "applicationDeadline", message: "Invalid date format" },
        { row: 6, field: "title", message: "Title is required" },
      ],
      createdBy: adminRow[0].id,
      createdAt: new Date(now - 5 * day),
      completedAt: new Date(now - 5 * day + 20000),
    },
  ]);

  await db.insert(automationSettings).values([
    {
      id: id(),
      key: "automation.global",
      value: {
        timezone: "Asia/Kolkata",
        reminderWindows: [7, 3, 1],
        maxRetries: 3,
        quietHoursRespected: true,
      },
      description: "Global automation configuration",
    },
    {
      id: id(),
      key: "notifications.duplicate-protection",
      value: { enabled: true, windowHours: 24 },
      description: "Idempotency window for notification deduplication",
    },
  ]);

  console.log("\n✅ Seed complete.");
  console.log("   Admin   : admin@engineerprep.in / Admin@123");
  console.log("   Student : arun@engineerprep.in / Student@123");
  console.log(`   Users   : ${studentRows.length + 1} total`);

  await pool.end();
}

seed().catch(async (error) => {
  console.error("❌ Seed failed:", error);
  await pool.end();
  process.exit(1);
});
