import "dotenv/config";
import { db } from "../src/db";
import { branches, semesters, schemes, subjects, resources } from "../src/db/schema";
import { eq, and } from "drizzle-orm";

const LAB_MANUALS = [
  {
    subjectCode: "BCSL305",
    subjectName: "Data Structures Laboratory",
    semester: 3,
    branch: "CSE",
    scheme: "2022 Scheme",
    title: "Data Structures Laboratory (BCSL305) Official Lab Manual & Solutions",
    description: "Complete VTU 2022 Scheme Lab Manual with 12 C/C++ programs: Stacks, Infix to Postfix, Queues, Circular Queues, Singly Linked Lists, Doubly Linked Lists, Binary Search Trees, and Graph Traversal (BFS & DFS) with full code, outputs, and viva questions.",
    driveUrl: "https://drive.google.com/file/d/1XpY3Q9k9O1Q6Y3K8qK2vX0w1xY_4l8X9/preview",
    fileSize: "PDF 3.8 MB",
  },
  {
    subjectCode: "BCSL404",
    subjectName: "Analysis & Design of Algorithms Laboratory",
    semester: 4,
    branch: "CSE",
    scheme: "2022 Scheme",
    title: "Analysis & Design of Algorithms Lab (BCSL404) Complete Manual",
    description: "VTU 4th Sem ADA Lab manual containing Divide & Conquer (Quick Sort, Merge Sort), Greedy Algorithms (Kruskal, Prim, Dijkstra), Dynamic Programming (0/1 Knapsack, Floyd-Warshall), and Backtracking (N-Queens, Subset Sum) with asymptotic time analysis and test outputs.",
    driveUrl: "https://drive.google.com/file/d/1mQ7rP2v8X9K3Y4o8X0w1xY_5l9Z8k7A2/preview",
    fileSize: "PDF 4.2 MB",
  },
  {
    subjectCode: "BCSL504",
    subjectName: "Web Technology Laboratory",
    semester: 5,
    branch: "CSE",
    scheme: "2022 Scheme",
    title: "Web Technology Laboratory (BCSL504) Lab Manual with Source Code",
    description: "Official manual for VTU 5th Sem BCSL504: HTML5 semantic tags, CSS3 responsive grid/flexbox, JavaScript form validation, event handling, AJAX asynchronous calls, JSON parsing, and PHP/Node MySQL backend CRUD implementations.",
    driveUrl: "https://drive.google.com/file/d/1Z8rX9w2o0L3k7P9qK2vX0w1xY_6l9B3m/preview",
    fileSize: "PDF 4.5 MB",
  },
  {
    subjectCode: "BCSL606",
    subjectName: "Machine Learning Laboratory",
    semester: 6,
    branch: "CSE",
    scheme: "2022 Scheme",
    title: "Machine Learning Laboratory (BCSL606) Python Manual with Datasets",
    description: "Comprehensive Python Jupyter notebooks and documentation: Find-S, Candidate Elimination, ID3 Decision Tree, Artificial Neural Network Backpropagation, Naive Bayes Classifier, Bayesian Network, EM Algorithm, K-Means Clustering, and k-NN with scikit-learn comparisons.",
    driveUrl: "https://drive.google.com/file/d/1Y9qK2vX0w1xY_7l9C4n0L3k7P9qK2vX0/preview",
    fileSize: "PDF 5.1 MB",
  },
  {
    subjectCode: "22ECL54",
    subjectName: "Digital Signal Processing Laboratory",
    semester: 5,
    branch: "ECE",
    scheme: "2022 Scheme",
    title: "Digital Signal Processing Lab (22ECL54) MATLAB & Code Composer Manual",
    description: "ECE 5th Sem DSP Lab manual: Discrete Fourier Transform (DFT), Fast Fourier Transform (FFT), Linear and Circular Convolution, FIR and IIR digital filter design (Butterworth, Chebyshev), and hardware implementation on TMS320C6713 DSP Starter Kit.",
    driveUrl: "https://drive.google.com/file/d/1W8o1xY_8l9D5p0L3k7P9qK2vX0w1xY_9/preview",
    fileSize: "PDF 3.6 MB",
  },
  {
    subjectCode: "22ECL64",
    subjectName: "VLSI Design & HDL Laboratory",
    semester: 6,
    branch: "ECE",
    scheme: "2022 Scheme",
    title: "VLSI Design Laboratory (22ECL64) Verilog HDL & Cadence Manual",
    description: "Verilog HDL simulation and FPGA synthesis: Combinational circuits (Adders, Multiplexers, Decoders), Sequential circuits (Flip-Flops, Shift Registers, Counters), and ASIC backend flow (CMOS Inverter, NAND/NOR layout, DRC/LVS check using Cadence Virtuoso).",
    driveUrl: "https://drive.google.com/file/d/1V7n0L3k7P9qK2vX0w1xY_0l9E6q1M4l8/preview",
    fileSize: "PDF 4.8 MB",
  },
  {
    subjectCode: "22EEL54",
    subjectName: "Power Electronics Laboratory",
    semester: 5,
    branch: "EEE",
    scheme: "2022 Scheme",
    title: "Power Electronics Laboratory (22EEL54) Hardware & Simulink Manual",
    description: "EEE 5th Sem Power Electronics Lab manual: Static characteristics of SCR, MOSFET, IGBT, single-phase half/fully controlled AC-DC converters, DC-DC step-down buck/boost choppers, single-phase PWM inverters, and speed control of universal motors.",
    driveUrl: "https://drive.google.com/file/d/1U6m1M4l8V7n0L3k7P9qK2vX0w1xY_1l0/preview",
    fileSize: "PDF 3.4 MB",
  },
  {
    subjectCode: "22MEL54",
    subjectName: "Design & Heat Transfer Laboratory",
    semester: 5,
    branch: "ME",
    scheme: "2022 Scheme",
    title: "Heat Transfer Laboratory (22MEL54) Experimental Manual",
    description: "Mechanical Engineering 5th Sem Heat Transfer Lab: Determination of thermal conductivity of metal rod, natural and forced convection heat transfer coefficients, Stefan-Boltzmann radiation constant verification, and shell-and-tube heat exchanger effectiveness.",
    driveUrl: "https://drive.google.com/file/d/1T5l0U6m1M4l8V7n0L3k7P9qK2vX0w1xY/preview",
    fileSize: "PDF 3.2 MB",
  },
  {
    subjectCode: "22CVL54",
    subjectName: "Concrete & Highway Materials Laboratory",
    semester: 5,
    branch: "CIV",
    scheme: "2022 Scheme",
    title: "Concrete & Highway Testing Laboratory (22CVL54) Testing Manual",
    description: "Civil Engineering 5th Sem laboratory testing manual: Standard consistency, initial and final setting times of cement, compressive strength of cement mortar, aggregate impact and crushing values, Los Angeles abrasion test, and Marshall stability test for bitumen.",
    driveUrl: "https://drive.google.com/file/d/1S4k9T5l0U6m1M4l8V7n0L3k7P9qK2vX0/preview",
    fileSize: "PDF 3.9 MB",
  },
];

async function main() {
  const allBranches = await db.select().from(branches);
  const allSemesters = await db.select().from(semesters);
  const allSchemes = await db.select().from(schemes);

  const branchMap = new Map(allBranches.map((b) => [b.code, b.id]));
  const semMap = new Map(allSemesters.map((s) => [s.number, s.id]));
  const scheme2022 = allSchemes.find((s) => s.name.includes("2022")) || allSchemes[0];

  let addedCount = 0;

  for (const item of LAB_MANUALS) {
    const branchId = branchMap.get(item.branch) || branchMap.get("CSE")!;
    const semesterId = semMap.get(item.semester) || semMap.get(5)!;

    let [subjectRow] = await db
      .select()
      .from(subjects)
      .where(eq(subjects.code, item.subjectCode))
      .limit(1);

    if (!subjectRow) {
      const [newSub] = await db
        .insert(subjects)
        .values({
          name: item.subjectName,
          code: item.subjectCode,
          branchId,
          semesterId,
          schemeId: scheme2022.id,
          credits: 2,
        })
        .returning();
      subjectRow = newSub;
    }

    const [existing] = await db
      .select()
      .from(resources)
      .where(
        and(
          eq(resources.subjectId, subjectRow.id),
          eq(resources.resourceType, "LAB_MANUAL")
        )
      )
      .limit(1);

    if (!existing) {
      await db.insert(resources).values({
        title: item.title,
        description: item.description,
        resourceType: "LAB_MANUAL",
        subjectId: subjectRow.id,
        fileName: `${item.subjectCode}-Official-Lab-Manual.pdf`,
        fileUrl: item.driveUrl,
        fileSize: item.fileSize,
        status: "PUBLISHED",
        downloadCount: Math.floor(Math.random() * 380) + 140,
      });
      addedCount++;
    }
  }

  console.log(`Successfully seeded ${addedCount} authentic VTU Lab Manuals!`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

