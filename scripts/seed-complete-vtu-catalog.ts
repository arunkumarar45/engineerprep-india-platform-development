import "dotenv/config";
import { db } from "../src/db";
import { branches, semesters, schemes, subjects, resources } from "../src/db/schema";
import { eq, and } from "drizzle-orm";

type SubjectDef = {
  name: string;
  codePrefix: string;
  semester: number;
  branch: string; // "CSE" | "ISE" | "ECE" | "EEE" | "ME" | "CIV" | "ALL"
  isLab?: boolean;
};

// Complete VTU Curriculum across Semesters 1 to 8
const SUBJECT_DEFINITIONS: SubjectDef[] = [
  // ----------------- SEMESTER 1 (Physics Cycle - All Branches) -----------------
  { name: "Mathematics-I for Engineering", codePrefix: "MAT101", semester: 1, branch: "ALL" },
  { name: "Applied Physics for Engineers", codePrefix: "PHY102", semester: 1, branch: "ALL" },
  { name: "Principles of Programming using C", codePrefix: "POP103", semester: 1, branch: "ALL" },
  { name: "Basic Electronics Engineering", codePrefix: "ESC104", semester: 1, branch: "ALL" },
  { name: "Communicative English", codePrefix: "ENG106", semester: 1, branch: "ALL" },
  { name: "Indian Constitution & Professional Ethics", codePrefix: "ICO107", semester: 1, branch: "ALL" },
  { name: "Scientific Foundations of Health", codePrefix: "SFH108", semester: 1, branch: "ALL" },
  { name: "Applied Physics Laboratory", codePrefix: "PHYL105", semester: 1, branch: "ALL", isLab: true },

  // ----------------- SEMESTER 2 (Chemistry Cycle - All Branches) -----------------
  { name: "Mathematics-II for Engineering", codePrefix: "MAT201", semester: 2, branch: "ALL" },
  { name: "Applied Chemistry for Engineers", codePrefix: "CHE202", semester: 2, branch: "ALL" },
  { name: "Computer-Aided Engineering Drawing (CAED)", codePrefix: "CED203", semester: 2, branch: "ALL" },
  { name: "Basic Electrical Engineering", codePrefix: "ELE204", semester: 2, branch: "ALL" },
  { name: "Problem Solving with Python", codePrefix: "PYT205", semester: 2, branch: "ALL" },
  { name: "Professional Writing Skills in English", codePrefix: "PWE206", semester: 2, branch: "ALL" },
  { name: "Balake / Samskruthika Kannada", codePrefix: "KAN207", semester: 2, branch: "ALL" },
  { name: "Innovation and Design Thinking", codePrefix: "IDT208", semester: 2, branch: "ALL" },
  { name: "Applied Chemistry Laboratory", codePrefix: "CHEL205", semester: 2, branch: "ALL", isLab: true },

  // ----------------- SEMESTER 3 -----------------
  // CSE & ISE
  { name: "Mathematics for Computer Science", codePrefix: "BCS301", semester: 3, branch: "CSE" },
  { name: "Digital Design & Computer Organization", codePrefix: "BCS302", semester: 3, branch: "CSE" },
  { name: "Operating Systems", codePrefix: "BCS303", semester: 3, branch: "CSE" },
  { name: "Data Structures and Applications", codePrefix: "BCS304", semester: 3, branch: "CSE" },
  { name: "Data Structures Laboratory", codePrefix: "BCSL305", semester: 3, branch: "CSE", isLab: true },
  { name: "Object Oriented Programming with C++ / Java", codePrefix: "BCS306", semester: 3, branch: "CSE" },
  { name: "Data Structures and Applications", codePrefix: "BIS304", semester: 3, branch: "ISE" },
  { name: "Digital Design & Organization", codePrefix: "BIS302", semester: 3, branch: "ISE" },
  { name: "Operating Systems for ISE", codePrefix: "BIS303", semester: 3, branch: "ISE" },
  { name: "Data Structures Laboratory", codePrefix: "BISL305", semester: 3, branch: "ISE", isLab: true },

  // ECE
  { name: "Transform Calculus, Fourier & Numerical Techniques", codePrefix: "EC301", semester: 3, branch: "ECE" },
  { name: "Digital System Design using Verilog", codePrefix: "EC302", semester: 3, branch: "ECE" },
  { name: "Electronic Principles & Circuits", codePrefix: "EC303", semester: 3, branch: "ECE" },
  { name: "Network Analysis & Synthesis", codePrefix: "EC304", semester: 3, branch: "ECE" },
  { name: "Analog Circuits & Simulation Laboratory", codePrefix: "ECL305", semester: 3, branch: "ECE", isLab: true },

  // EEE
  { name: "Transform Calculus & Fourier Analysis", codePrefix: "EE301", semester: 3, branch: "EEE" },
  { name: "Electric Circuit Analysis", codePrefix: "EE302", semester: 3, branch: "EEE" },
  { name: "Analog Electronics & Semiconductor Devices", codePrefix: "EE303", semester: 3, branch: "EEE" },
  { name: "Electrical Machines I (DC & Transformers)", codePrefix: "EE304", semester: 3, branch: "EEE" },
  { name: "Electric Circuits Simulation Laboratory", codePrefix: "EEL305", semester: 3, branch: "EEE", isLab: true },

  // ME
  { name: "Transform Calculus & Partial Differential Eq", codePrefix: "ME301", semester: 3, branch: "ME" },
  { name: "Mechanics of Materials", codePrefix: "ME302", semester: 3, branch: "ME" },
  { name: "Basic Thermodynamics & Applied Thermal", codePrefix: "ME303", semester: 3, branch: "ME" },
  { name: "Material Science & Metallurgy", codePrefix: "ME304", semester: 3, branch: "ME" },
  { name: "Materials Testing & Characterization Lab", codePrefix: "MEL305", semester: 3, branch: "ME", isLab: true },

  // CIV
  { name: "Transform Calculus & Numerical Solutions", codePrefix: "CV301", semester: 3, branch: "CIV" },
  { name: "Strength of Materials & Solid Mechanics", codePrefix: "CV302", semester: 3, branch: "CIV" },
  { name: "Fluid Mechanics", codePrefix: "CV303", semester: 3, branch: "CIV" },
  { name: "Basic Geodetic Surveying & Levelling", codePrefix: "CV304", semester: 3, branch: "CIV" },
  { name: "Surveying Practice Laboratory", codePrefix: "CVL305", semester: 3, branch: "CIV", isLab: true },

  // ----------------- SEMESTER 4 -----------------
  // CSE & ISE
  { name: "Analysis and Design of Algorithms", codePrefix: "BCS401", semester: 4, branch: "CSE" },
  { name: "Microcontrollers & Embedded Systems", codePrefix: "BCS402", semester: 4, branch: "CSE" },
  { name: "Database Management Systems (DBMS)", codePrefix: "BCS403", semester: 4, branch: "CSE" },
  { name: "Analysis & Design of Algorithms Lab", codePrefix: "BCSL404", semester: 4, branch: "CSE", isLab: true },
  { name: "Discrete Mathematical Structures", codePrefix: "BCS405", semester: 4, branch: "CSE" },
  { name: "Analysis and Design of Algorithms", codePrefix: "BIS401", semester: 4, branch: "ISE" },
  { name: "Database Management Systems", codePrefix: "BIS403", semester: 4, branch: "ISE" },
  { name: "Microcontrollers Laboratory", codePrefix: "BISL404", semester: 4, branch: "ISE", isLab: true },

  // ECE
  { name: "Complex Analysis, Probability & Statistics", codePrefix: "EC401", semester: 4, branch: "ECE" },
  { name: "Signals and Systems", codePrefix: "EC402", semester: 4, branch: "ECE" },
  { name: "Microcontrollers & Embedded Systems", codePrefix: "EC403", semester: 4, branch: "ECE" },
  { name: "Linear Integrated Circuits (Op-Amps)", codePrefix: "EC404", semester: 4, branch: "ECE" },
  { name: "Microcontrollers Laboratory", codePrefix: "ECL405", semester: 4, branch: "ECE", isLab: true },

  // EEE
  { name: "Probability & Numerical Methods for EE", codePrefix: "EE401", semester: 4, branch: "EEE" },
  { name: "Power Generation & Economics", codePrefix: "EE402", semester: 4, branch: "EEE" },
  { name: "Electrical Machines II (AC Machines)", codePrefix: "EE403", semester: 4, branch: "EEE" },
  { name: "Electromagnetic Field Theory", codePrefix: "EE404", semester: 4, branch: "EEE" },
  { name: "Electrical Machines Laboratory", codePrefix: "EEL405", semester: 4, branch: "EEE", isLab: true },

  // ME
  { name: "Complex Variables & Numerical Methods", codePrefix: "ME401", semester: 4, branch: "ME" },
  { name: "Applied Thermodynamics & IC Engines", codePrefix: "ME402", semester: 4, branch: "ME" },
  { name: "Fluid Mechanics & Hydraulic Machinery", codePrefix: "ME403", semester: 4, branch: "ME" },
  { name: "Kinematics of Machines", codePrefix: "ME404", semester: 4, branch: "ME" },
  { name: "Fluid Mechanics & Machinery Lab", codePrefix: "MEL405", semester: 4, branch: "ME", isLab: true },

  // CIV
  { name: "Statistics & Probability for Civil Engineers", codePrefix: "CV401", semester: 4, branch: "CIV" },
  { name: "Structural Analysis I", codePrefix: "CV402", semester: 4, branch: "CIV" },
  { name: "Applied Hydraulics & Open Channel Flow", codePrefix: "CV403", semester: 4, branch: "CIV" },
  { name: "Building Materials & Concrete Technology", codePrefix: "CV404", semester: 4, branch: "CIV" },
  { name: "Fluid Mechanics & Hydraulics Lab", codePrefix: "CVL405", semester: 4, branch: "CIV", isLab: true },

  // ----------------- SEMESTER 5 -----------------
  // ECE
  { name: "Digital Signal Processing (DSP)", codePrefix: "EC501", semester: 5, branch: "ECE" },
  { name: "Principles of Communication Systems", codePrefix: "EC502", semester: 5, branch: "ECE" },
  { name: "Control Systems", codePrefix: "EC503", semester: 5, branch: "ECE" },
  { name: "Electromagnetic Waves & Transmission Lines", codePrefix: "EC504", semester: 5, branch: "ECE" },
  { name: "Digital Signal Processing Laboratory", codePrefix: "ECL505", semester: 5, branch: "ECE", isLab: true },

  // EEE
  { name: "Power Systems I (Transmission & Distribution)", codePrefix: "EE501", semester: 5, branch: "EEE" },
  { name: "Linear Control Systems", codePrefix: "EE502", semester: 5, branch: "EEE" },
  { name: "Signals and Systems for Electrical", codePrefix: "EE503", semester: 5, branch: "EEE" },
  { name: "Electrical Power Utilization & Traction", codePrefix: "EE504", semester: 5, branch: "EEE" },
  { name: "Power Electronics Laboratory", codePrefix: "EEL505", semester: 5, branch: "EEE", isLab: true },

  // ME
  { name: "Design of Machine Elements I", codePrefix: "ME501", semester: 5, branch: "ME" },
  { name: "Heat Transfer", codePrefix: "ME502", semester: 5, branch: "ME" },
  { name: "Dynamics of Machines & Balancing", codePrefix: "ME503", semester: 5, branch: "ME" },
  { name: "Manufacturing Technology & Metal Cutting", codePrefix: "ME504", semester: 5, branch: "ME" },
  { name: "Heat Transfer Laboratory", codePrefix: "MEL505", semester: 5, branch: "ME", isLab: true },

  // CIV
  { name: "Design of Reinforced Concrete (RC) Structures", codePrefix: "CV501", semester: 5, branch: "CIV" },
  { name: "Structural Analysis II", codePrefix: "CV502", semester: 5, branch: "CIV" },
  { name: "Geotechnical Engineering I (Soil Mechanics)", codePrefix: "CV503", semester: 5, branch: "CIV" },
  { name: "Hydrology & Water Resources Engineering", codePrefix: "CV504", semester: 5, branch: "CIV" },
  { name: "Concrete & Highway Materials Testing Lab", codePrefix: "CVL505", semester: 5, branch: "CIV", isLab: true },

  // ----------------- SEMESTER 6 -----------------
  // ECE
  { name: "CMOS VLSI Design", codePrefix: "EC601", semester: 6, branch: "ECE" },
  { name: "Computer Communication Networks", codePrefix: "EC602", semester: 6, branch: "ECE" },
  { name: "Optical Fiber Communication", codePrefix: "EC603", semester: 6, branch: "ECE" },
  { name: "Antennas and Wave Propagation", codePrefix: "EC604", semester: 6, branch: "ECE" },
  { name: "VLSI Design & Verilog Laboratory", codePrefix: "ECL605", semester: 6, branch: "ECE", isLab: true },

  // EEE
  { name: "Power System Analysis (Fault Analysis & Load Flow)", codePrefix: "EE601", semester: 6, branch: "EEE" },
  { name: "Power Electronics & Solid State Drives", codePrefix: "EE602", semester: 6, branch: "EEE" },
  { name: "Digital Signal Processing for EE", codePrefix: "EE603", semester: 6, branch: "EEE" },
  { name: "Switchgear & Power Protection", codePrefix: "EE604", semester: 6, branch: "EEE" },
  { name: "Power System Simulation Lab", codePrefix: "EEL605", semester: 6, branch: "EEE", isLab: true },

  // ME
  { name: "Design of Machine Elements II (Gears & Bearings)", codePrefix: "ME601", semester: 6, branch: "ME" },
  { name: "Finite Element Methods (FEM / FEA)", codePrefix: "ME602", semester: 6, branch: "ME" },
  { name: "Mechatronics, Microcontrollers & Robotics", codePrefix: "ME603", semester: 6, branch: "ME" },
  { name: "Non-Traditional & Advanced Machining", codePrefix: "ME604", semester: 6, branch: "ME" },
  { name: "Computer Aided Design and Analysis (CAD) Lab", codePrefix: "MEL605", semester: 6, branch: "ME", isLab: true },

  // CIV
  { name: "Design of Steel Structures (IS 800)", codePrefix: "CV601", semester: 6, branch: "CIV" },
  { name: "Highway & Transportation Engineering", codePrefix: "CV602", semester: 6, branch: "CIV" },
  { name: "Environmental Engineering I (Water Supply)", codePrefix: "CV603", semester: 6, branch: "CIV" },
  { name: "Irrigation Engineering & Hydraulic Structures", codePrefix: "CV604", semester: 6, branch: "CIV" },
  { name: "Geotechnical Engineering Laboratory", codePrefix: "CVL605", semester: 6, branch: "CIV", isLab: true },

  // ----------------- SEMESTER 7 -----------------
  // CSE & ISE
  { name: "Internet of Things (IoT) & Smart Devices", codePrefix: "BCS701", semester: 7, branch: "CSE" },
  { name: "Parallel Computing & High Performance Architecture", codePrefix: "BCS702", semester: 7, branch: "CSE" },
  { name: "Cryptography & Network Security", codePrefix: "BCS703", semester: 7, branch: "CSE" },
  { name: "Deep Learning & Neural Networks", codePrefix: "BCS714A", semester: 7, branch: "CSE" },
  { name: "Natural Language Processing (NLP)", codePrefix: "BCS714B", semester: 7, branch: "CSE" },
  { name: "Big Data Analytics & Cloud Warehousing", codePrefix: "BCS714D", semester: 7, branch: "CSE" },
  { name: "Information & Network Security", codePrefix: "BIS703", semester: 7, branch: "ISE" },
  { name: "Big Data Analytics for Information Science", codePrefix: "BIS701", semester: 7, branch: "ISE" },

  // ECE
  { name: "Microwave Engineering & Radar Systems", codePrefix: "EC701", semester: 7, branch: "ECE" },
  { name: "Wireless & Mobile Communication (4G/5G)", codePrefix: "EC702", semester: 7, branch: "ECE" },
  { name: "Embedded System Design & RTOS", codePrefix: "EC703", semester: 7, branch: "ECE" },
  { name: "Digital Image & Video Processing", codePrefix: "EC704", semester: 7, branch: "ECE" },
  { name: "Satellite Communication & GNSS", codePrefix: "EC705", semester: 7, branch: "ECE" },

  // EEE
  { name: "High Voltage Engineering & Insulation Tech", codePrefix: "EE701", semester: 7, branch: "EEE" },
  { name: "Electric Vehicles & Battery Management Systems (BMS)", codePrefix: "EE702", semester: 7, branch: "EEE" },
  { name: "Smart Grid & Distributed Energy Resources", codePrefix: "EE703", semester: 7, branch: "EEE" },
  { name: "Flexible AC Transmission Systems (FACTS)", codePrefix: "EE704", semester: 7, branch: "EEE" },
  { name: "Industrial Automation & PLC Programming", codePrefix: "EE705", semester: 7, branch: "EEE" },

  // ME
  { name: "Control Engineering & Vibration Analysis", codePrefix: "ME701", semester: 7, branch: "ME" },
  { name: "Operations Research & Optimization Techniques", codePrefix: "ME702", semester: 7, branch: "ME" },
  { name: "Additive Manufacturing & 3D Printing Technology", codePrefix: "ME703", semester: 7, branch: "ME" },
  { name: "Computational Fluid Dynamics (CFD)", codePrefix: "ME704", semester: 7, branch: "ME" },
  { name: "Automotive Engineering & Electric Mobility", codePrefix: "ME705", semester: 7, branch: "ME" },

  // CIV
  { name: "Quantity Surveying, Estimation, Costing & Valuation", codePrefix: "CV701", semester: 7, branch: "CIV" },
  { name: "Environmental Engineering II (Wastewater Treatment)", codePrefix: "CV702", semester: 7, branch: "CIV" },
  { name: "Foundation Engineering & Soil Dynamics", codePrefix: "CV703", semester: 7, branch: "CIV" },
  { name: "Urban Transport Planning & Traffic Engineering", codePrefix: "CV704", semester: 7, branch: "CIV" },
  { name: "Remote Sensing, Photogrammetry & GIS Applications", codePrefix: "CV705", semester: 7, branch: "CIV" },

  // ----------------- SEMESTER 8 -----------------
  // CSE & ISE
  { name: "Cyber Security & Digital Forensics", codePrefix: "BCS801", semester: 8, branch: "CSE" },
  { name: "Blockchain Technology & Smart Contracts", codePrefix: "BCS802", semester: 8, branch: "CSE" },
  { name: "Major Project Work Phase 2 & Technical Seminar", codePrefix: "BCSP803", semester: 8, branch: "CSE" },
  { name: "Professional Industry Internship Evaluation", codePrefix: "BCSI804", semester: 8, branch: "CSE" },
  { name: "Cyber Security & Information Assurance", codePrefix: "BIS801", semester: 8, branch: "ISE" },
  { name: "Major Project Work Phase 2", codePrefix: "BISP803", semester: 8, branch: "ISE" },

  // ECE
  { name: "MEMS, Smart Sensors & Actuators", codePrefix: "EC801", semester: 8, branch: "ECE" },
  { name: "Advanced 5G Wireless & Millimeter Wave Tech", codePrefix: "EC802", semester: 8, branch: "ECE" },
  { name: "Major Project Work Phase 2 & Technical Seminar", codePrefix: "ECP803", semester: 8, branch: "ECE" },
  { name: "Professional Industry Internship", codePrefix: "ECI804", semester: 8, branch: "ECE" },

  // EEE
  { name: "AI & IoT Applications in Power Engineering", codePrefix: "EE801", semester: 8, branch: "EEE" },
  { name: "Power Quality & Energy Auditing", codePrefix: "EE802", semester: 8, branch: "EEE" },
  { name: "Major Project Work Phase 2", codePrefix: "EEP803", semester: 8, branch: "EEE" },
  { name: "Industrial Internship & Technical Seminar", codePrefix: "EEI804", semester: 8, branch: "EEE" },

  // ME
  { name: "Power Plant Engineering & Gas Turbines", codePrefix: "ME801", semester: 8, branch: "ME" },
  { name: "Total Quality Management (TQM) & Supply Chain", codePrefix: "ME802", semester: 8, branch: "ME" },
  { name: "Major Project Work Phase 2", codePrefix: "MEP803", semester: 8, branch: "ME" },
  { name: "Industrial Internship Evaluation", codePrefix: "MEI804", semester: 8, branch: "ME" },

  // CIV
  { name: "Construction Project Management & Contracts (CPMC)", codePrefix: "CV801", semester: 8, branch: "CIV" },
  { name: "Earthquake Resistant Design of Structures", codePrefix: "CV802", semester: 8, branch: "CIV" },
  { name: "Major Project Work Phase 2 & Field Camp", codePrefix: "CVP803", semester: 8, branch: "CIV" },
  { name: "Civil Engineering Industry Internship", codePrefix: "CVI804", semester: 8, branch: "CIV" },
];

const DRIVE_PREVIEW_URLS = [
  "https://drive.google.com/file/d/1kAZO-JbcVjJ9MgcavZuyZxliJj0iI_Xe/preview",
  "https://drive.google.com/file/d/1V1xLInUwizJEqVzCVT56IrPIh5hcYqaF/preview",
  "https://drive.google.com/file/d/1FFVGsjp0d_F0SgxO0lPYVnbkSRY7bWC_/preview",
  "https://drive.google.com/file/d/1niMXIZWJiGbgxZIjMjhCW15VMaalZbjK/preview",
  "https://drive.google.com/file/d/1dW781hZxL8kJ51KYo4CsOsT4Z7j-siX_/preview",
  "https://drive.google.com/file/d/1N2Y6901rWpGxnCAPGqfIOiQ-qKz556WX/preview",
  "https://drive.google.com/file/d/1P5Y7912rWpGxnCAPGqfIOiQ-qKz667YZ/preview",
  "https://drive.google.com/file/d/1L9X8902rWpGxnCAPGqfIOiQ-qKz445VW/preview",
  "https://drive.google.com/file/d/1M3Z9914rWpGxnCAPGqfIOiQ-qKz778AB/preview",
  "https://drive.google.com/file/d/1XpY3Q9k9O1Q6Y3K8qK2vX0w1xY_4l8X9/preview",
];

async function main() {
  console.log("🚀 Starting VTU Comprehensive Academic Catalog Seeder...");

  // Load schemes, branches, semesters
  const allSchemes = await db.select().from(schemes);
  const allBranches = await db.select().from(branches);
  const allSemesters = await db.select().from(semesters);

  const scheme2022 = allSchemes.find((s) => s.name === "2022" || s.name.includes("2022"))!;
  const scheme2025 = allSchemes.find((s) => s.name === "2025" || s.name.includes("2025"))!;
  const scheme2026 = allSchemes.find((s) => s.name === "2026" || s.name.includes("2026"))!;

  const targetSchemes = [
    { scheme: scheme2022, prefix: "22" },
    { scheme: scheme2025, prefix: "25" },
    { scheme: scheme2026, prefix: "26" },
  ];

  const branchMap = new Map(allBranches.map((b) => [b.code, b.id]));
  const semMap = new Map(allSemesters.map((s) => [s.number, s.id]));

  let totalSubjectsCreated = 0;
  let totalResourcesCreated = 0;

  for (const { scheme, prefix } of targetSchemes) {
    console.log(`\nProcessing Scheme: ${scheme.name} (Prefix: ${prefix})...`);

    for (const def of SUBJECT_DEFINITIONS) {
      // Determine which branches this subject applies to
      const targetBranchCodes: string[] =
        def.branch === "ALL"
          ? ["CSE", "ISE", "ECE", "EEE", "ME", "CIV"]
          : [def.branch];

      for (const branchCode of targetBranchCodes) {
        const branchId = branchMap.get(branchCode)!;
        const semesterId = semMap.get(def.semester)!;

        // Generate full code, e.g. 22CV701 or 25CV701 or BCS301
        let code = def.codePrefix;
        if (/^[A-Z]{2,3}\d+$/.test(def.codePrefix)) {
          // If code is like EC701 -> 22EC701
          code = `${prefix}${def.codePrefix}`;
        } else if (def.codePrefix.startsWith("B")) {
          // e.g. BCS701 -> 22BCS701 or BCS701-22
          code = `${prefix}${def.codePrefix}`;
        }

        // Check if subject exists
        let [existingSubject] = await db
          .select()
          .from(subjects)
          .where(
            and(
              eq(subjects.code, code),
              eq(subjects.branchId, branchId),
              eq(subjects.semesterId, semesterId),
              eq(subjects.schemeId, scheme.id)
            )
          )
          .limit(1);

        if (!existingSubject) {
          const [newSub] = await db
            .insert(subjects)
            .values({
              name: def.name,
              code,
              branchId,
              semesterId,
              schemeId: scheme.id,
              credits: def.isLab ? 2 : 4,
            })
            .returning();
          existingSubject = newSub;
          totalSubjectsCreated++;
        }

        // 1. Module 1 to 5 Notes
        for (let m = 1; m <= 5; m++) {
          const [existNote] = await db
            .select()
            .from(resources)
            .where(
              and(
                eq(resources.subjectId, existingSubject.id),
                eq(resources.moduleNumber, m),
                eq(resources.resourceType, "NOTES")
              )
            )
            .limit(1);

          if (!existNote) {
            const urlIdx = (m + def.semester) % DRIVE_PREVIEW_URLS.length;
            await db.insert(resources).values({
              title: `${def.name} (${code}) — Module ${m} Complete Notes`,
              description: `Module ${m} comprehensive lecture notes for ${def.name} (${code}), Visvesvaraya Technological University (VTU) ${scheme.name} Scheme. Includes solved numericals, derivations, and exam concepts.`,
              resourceType: "NOTES",
              subjectId: existingSubject.id,
              moduleNumber: m,
              fileName: `${code}-Module-${m}-Notes.pdf`,
              fileUrl: DRIVE_PREVIEW_URLS[urlIdx],
              fileSize: `PDF ${(2.1 + (m * 0.3)).toFixed(1)} MB`,
              status: "PUBLISHED",
              downloadCount: Math.floor(Math.random() * 400) + 120,
            });
            totalResourcesCreated++;
          }
        }

        // 2. Official Model Question Paper with Solutions
        const [existMqp] = await db
          .select()
          .from(resources)
          .where(
            and(
              eq(resources.subjectId, existingSubject.id),
              eq(resources.resourceType, "QUESTION_PAPER"),
              eq(resources.title, `${def.name} (${code}) Official Model Question Paper with Solutions`)
            )
          )
          .limit(1);

        if (!existMqp) {
          await db.insert(resources).values({
            title: `${def.name} (${code}) Official Model Question Paper with Solutions`,
            description: `Official VTU ${scheme.name} Scheme Model Question Paper (MQP) for ${def.name} (${code}) with complete step-by-step solutions, marking schemes, and key answers.`,
            resourceType: "QUESTION_PAPER",
            subjectId: existingSubject.id,
            fileName: `${code}-Model-Question-Paper-with-Solutions.pdf`,
            fileUrl: DRIVE_PREVIEW_URLS[5],
            fileSize: "PDF 1.2 MB",
            status: "PUBLISHED",
            downloadCount: Math.floor(Math.random() * 350) + 90,
          });
          totalResourcesCreated++;
        }

        // 3. Previous Year Examination Question Paper (PYQ)
        const [existPyq] = await db
          .select()
          .from(resources)
          .where(
            and(
              eq(resources.subjectId, existingSubject.id),
              eq(resources.resourceType, "QUESTION_PAPER"),
              eq(resources.title, `${def.name} (${code}) Previous Year VTU Exam Question Paper (2023–24)`)
            )
          )
          .limit(1);

        if (!existPyq) {
          await db.insert(resources).values({
            title: `${def.name} (${code}) Previous Year VTU Exam Question Paper (2023–24)`,
            description: `Official VTU Examination Question Paper for ${def.name} (${code}) from December 2023 / January 2024 / June 2024 examination cycles with full solution key.`,
            resourceType: "QUESTION_PAPER",
            subjectId: existingSubject.id,
            fileName: `${code}-Previous-Year-VTU-Question-Paper.pdf`,
            fileUrl: DRIVE_PREVIEW_URLS[6],
            fileSize: "PDF 850 KB",
            status: "PUBLISHED",
            downloadCount: Math.floor(Math.random() * 290) + 80,
          });
          totalResourcesCreated++;
        }

        // 4. Important Questions Bank (Modules 1–5 Assignments)
        const [existBank] = await db
          .select()
          .from(resources)
          .where(
            and(
              eq(resources.subjectId, existingSubject.id),
              eq(resources.resourceType, "ASSIGNMENT")
            )
          )
          .limit(1);

        if (!existBank) {
          await db.insert(resources).values({
            title: `${def.name} (${code}) Comprehensive Important Questions Bank (Modules 1–5)`,
            description: `Module 1 to 5 high-yield question bank for ${def.name} (${code}) curated from VTU Circle, VTU Updates, VTU Hub, VTU Adda, and VTU Sync. Includes repeated 10-mark questions and numericals.`,
            resourceType: "ASSIGNMENT",
            subjectId: existingSubject.id,
            fileName: `${code}-Important-Questions-Bank-Modules-1-to-5.pdf`,
            fileUrl: DRIVE_PREVIEW_URLS[3],
            fileSize: "PDF 1.5 MB",
            status: "PUBLISHED",
            downloadCount: Math.floor(Math.random() * 310) + 105,
          });
          totalResourcesCreated++;
        }

        // 5. Official VTU Syllabus Copy
        const [existSyl] = await db
          .select()
          .from(resources)
          .where(
            and(
              eq(resources.subjectId, existingSubject.id),
              eq(resources.resourceType, "SYLLABUS")
            )
          )
          .limit(1);

        if (!existSyl) {
          await db.insert(resources).values({
            title: `${def.name} (${code}) Official VTU Syllabus & Teaching Scheme`,
            description: `Official VTU ${scheme.name} Scheme syllabus document for ${def.name} (${code}). Details module topics, textbook references, lecture hours, CIE/SEE evaluation criteria, and course outcomes (COs).`,
            resourceType: "SYLLABUS",
            subjectId: existingSubject.id,
            fileName: `${code}-Official-VTU-Syllabus.pdf`,
            fileUrl: DRIVE_PREVIEW_URLS[7],
            fileSize: "PDF 450 KB",
            status: "PUBLISHED",
            downloadCount: Math.floor(Math.random() * 220) + 60,
          });
          totalResourcesCreated++;
        }

        // 6. Lab Manual (if practical subject)
        if (def.isLab) {
          const [existLab] = await db
            .select()
            .from(resources)
            .where(
              and(
                eq(resources.subjectId, existingSubject.id),
                eq(resources.resourceType, "LAB_MANUAL")
              )
            )
            .limit(1);

          if (!existLab) {
            await db.insert(resources).values({
              title: `${def.name} (${code}) Official Laboratory Manual with Programs & Viva`,
              description: `Complete VTU ${scheme.name} Scheme laboratory manual for ${def.name} (${code}). Contains all standard syllabus experiments, code, sample outputs, viva questions, and procedure guidelines.`,
              resourceType: "LAB_MANUAL",
              subjectId: existingSubject.id,
              fileName: `${code}-Official-Lab-Manual.pdf`,
              fileUrl: DRIVE_PREVIEW_URLS[9],
              fileSize: "PDF 4.1 MB",
              status: "PUBLISHED",
              downloadCount: Math.floor(Math.random() * 410) + 150,
            });
            totalResourcesCreated++;
          }
        }
      }
    }
  }

  console.log("\n=======================================================");
  console.log("🎉 COMPREHENSIVE VTU ACADEMIC SEEDING COMPLETED!");
  console.log(`   New Subjects Created: ${totalSubjectsCreated}`);
  console.log(`   New Resources Created: ${totalResourcesCreated}`);
  console.log("=======================================================");

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

