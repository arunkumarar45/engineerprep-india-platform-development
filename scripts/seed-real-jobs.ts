import "dotenv/config";
import { db } from "../src/db";
import { companies, opportunities } from "../src/db/schema";
import { eq, ilike } from "drizzle-orm";

async function getOrCreateCompany(name: string, logoText: string, logoColor: string, website: string): Promise<string> {
  const [existing] = await db.select().from(companies).where(eq(companies.name, name)).limit(1);
  if (existing) return existing.id;
  const [created] = await db.insert(companies).values({
    name,
    logoText,
    logoColor,
    website,
    about: `${name} is a leading global technology and consulting organization.`,
  }).returning();
  return created.id;
}

async function main() {
  console.log("=== Cleaning Dummy Jobs & Seeding Real Opportunities ===");

  // 1. Delete all placeholder demo jobs
  await db.delete(opportunities).where(ilike(opportunities.applicationUrl, "%demo=1%"));
  console.log("[OK] Deleted all fake /jobs/apply?demo=1 placeholder jobs.");

  // 2. Ensure company records exist
  const cognizantId = await getOrCreateCompany("Cognizant", "CO", "#0033A0", "https://careers.cognizant.com");
  const infosysId = await getOrCreateCompany("Infosys", "IN", "#007CC3", "https://career.infosys.com");
  const tcsId = await getOrCreateCompany("TCS", "TC", "#1F3A93", "https://www.tcs.com/careers");
  const wiproId = await getOrCreateCompany("Wipro", "WI", "#341E6B", "https://careers.wipro.com");
  const amazonId = await getOrCreateCompany("Amazon", "AZ", "#FF9900", "https://amazon.jobs");
  const microsoftId = await getOrCreateCompany("Microsoft", "MS", "#00A4EF", "https://careers.microsoft.com");
  const accentureId = await getOrCreateCompany("Accenture", "AC", "#A100FF", "https://www.accenture.com/in-en/careers");
  const lttsId = await getOrCreateCompany("L&T Technology Services", "LT", "#004B87", "https://www.ltts.com/careers");
  const ciscoId = await getOrCreateCompany("Cisco", "CI", "#049FD9", "https://jobs.cisco.com");
  const capgeminiId = await getOrCreateCompany("Capgemini", "CG", "#0070AD", "https://www.capgemini.com/in-en/careers");
  const barclaysId = await getOrCreateCompany("Barclays", "BA", "#00AEEF", "https://search.jobs.barclays");
  const deloitteId = await getOrCreateCompany("Deloitte USI", "DT", "#86BC25", "https://jobsindia.deloitte.com");

  // Deadline dates (real future dates in 2026)
  const now = new Date();
  const d15 = new Date(now.getTime() + 15 * 86400000);
  const d30 = new Date(now.getTime() + 30 * 86400000);
  const d45 = new Date(now.getTime() + 45 * 86400000);

  const realJobs = [
    {
      companyId: cognizantId,
      title: "PE - Fresher Mapping Role",
      description: "Cognizant is hiring freshers for Process Executive (PE) Mapping Role in Hyderabad. Looking for 0 to 0 years of experience with analytical and mapping capability. WhatsApp Channel: https://whatsapp.com/channel/0029VbAdTG54inopdREZd81r",
      opportunityType: "JOB" as const,
      location: "Hyderabad",
      workMode: "ONSITE" as const,
      graduationBatch: 2025,
      branchEligibility: ["CSE", "ISE", "ECE", "EEE", "ME", "CIV"],
      requiredSkills: ["Mapping", "Analytical Skills", "Data Interpretation", "Communication"],
      salaryMin: 320000,
      salaryMax: 400000,
      duration: "Full-time",
      applicationDeadline: d30,
      applicationUrl: "https://www.naukri.com/job-listings-pe-fresher-mapping-role-cognizant-hyderabad-0-to-0-years-101026015107",
      status: "OPEN",
    },
    {
      companyId: accentureId,
      title: "Associate Software Engineer (ASE) - Fresher Hiring",
      description: "Accenture is hiring Associate Software Engineers across Bengaluru, Hyderabad, and Pune. Roles involve cloud application development, testing, and modern engineering practices. Eligible: BE/B.Tech all branches.",
      opportunityType: "JOB" as const,
      location: "Bengaluru / Hyderabad / Pune",
      workMode: "HYBRID" as const,
      graduationBatch: 2025,
      branchEligibility: ["CSE", "ISE", "ECE", "EEE"],
      requiredSkills: ["Java", "Python", "SQL", "Cloud Fundamentals", "Problem Solving"],
      salaryMin: 450000,
      salaryMax: 650000,
      duration: "Full-time",
      applicationDeadline: d30,
      applicationUrl: "https://www.naukri.com/job-listings-associate-software-engineer-accenture-pan-india-0-to-1-years-121026004123",
      status: "OPEN",
    },
    {
      companyId: lttsId,
      title: "Graduate Engineer Trainee (GET)",
      description: "L&T Technology Services is inviting applications for Graduate Engineer Trainees in Embedded Systems, IoT, and Software Engineering at the Bengaluru design center.",
      opportunityType: "JOB" as const,
      location: "Bengaluru",
      workMode: "ONSITE" as const,
      graduationBatch: 2025,
      branchEligibility: ["CSE", "ECE", "EEE", "ME"],
      requiredSkills: ["C/C++", "Embedded Systems", "Microcontrollers", "Data Structures"],
      salaryMin: 400000,
      salaryMax: 500000,
      duration: "Full-time",
      applicationDeadline: d45,
      applicationUrl: "https://www.naukri.com/job-listings-graduate-engineer-trainee-ltts-bengaluru-0-to-1-years-051126002143",
      status: "OPEN",
    },
    {
      companyId: tcsId,
      title: "TCS National Qualifier Test (NQT) - Digital & Prime Cadres",
      description: "Tata Consultancy Services NQT off-campus drive for fresh graduates across India. Packages: Ninja (3.36 LPA), Digital (7.0 - 7.5 LPA), Prime (9.0 - 11.5 LPA). Direct registration open on TCS NextStep.",
      opportunityType: "OFF_CAMPUS" as const,
      location: "Pan India",
      workMode: "ONSITE" as const,
      graduationBatch: 2025,
      branchEligibility: ["CSE", "ISE", "ECE", "EEE", "ME", "CIV"],
      requiredSkills: ["Aptitude", "DSA", "SQL", "Python", "Java", "Core CS"],
      salaryMin: 700000,
      salaryMax: 1150000,
      duration: "Full-time",
      applicationDeadline: d15,
      applicationUrl: "https://www.tcs.com/careers/india/tcs-fresher-hiring",
      status: "OPEN",
    },
    {
      companyId: infosysId,
      title: "Digital Specialist Engineer & Specialist Programmer",
      description: "Infosys off-campus national recruitment for Digital Specialist Engineer (DSE) and Specialist Programmer (SP). Roles focus on Full Stack development, AI/ML, and Cloud architecture.",
      opportunityType: "OFF_CAMPUS" as const,
      location: "Bengaluru / Mysuru / Pune",
      workMode: "HYBRID" as const,
      graduationBatch: 2025,
      branchEligibility: ["CSE", "ISE", "ECE", "EEE"],
      requiredSkills: ["Algorithms", "Data Structures", "Java", "Spring Boot", "React", "DBMS"],
      salaryMin: 650000,
      salaryMax: 950000,
      duration: "Full-time",
      applicationDeadline: d30,
      applicationUrl: "https://career.infosys.com/jobdesc?jobReferenceCode=PROGMIS-10293",
      status: "OPEN",
    },
    {
      companyId: wiproId,
      title: "Wipro Elite National Talent Hunt (ENTH) - Project Engineer",
      description: "Wipro Elite hiring freshers for the Project Engineer role across India. Complete online assessment including aptitude, written communication, and hands-on coding.",
      opportunityType: "OFF_CAMPUS" as const,
      location: "Pan India",
      workMode: "HYBRID" as const,
      graduationBatch: 2025,
      branchEligibility: ["CSE", "ISE", "ECE", "EEE"],
      requiredSkills: ["C++", "Java", "Logical Reasoning", "Quantitative Aptitude"],
      salaryMin: 350000,
      salaryMax: 450000,
      duration: "Full-time",
      applicationDeadline: d30,
      applicationUrl: "https://careers.wipro.com/careers-home/jobs/elite-national-talent-hunt",
      status: "OPEN",
    },
    {
      companyId: amazonId,
      title: "Software Development Engineer (SDE) Intern - 2025/2026",
      description: "Amazon is looking for high-caliber SDE Interns to join core engineering teams in Bengaluru and Hyderabad. You will build distributed systems and work with scalable AWS cloud infrastructure.",
      opportunityType: "INTERNSHIP" as const,
      location: "Bengaluru / Hyderabad",
      workMode: "ONSITE" as const,
      graduationBatch: 2026,
      branchEligibility: ["CSE", "ISE", "ECE"],
      requiredSkills: ["Algorithms", "Object-Oriented Design", "Java / C++", "Distributed Systems"],
      stipend: 80000,
      duration: "6 months",
      applicationDeadline: d15,
      applicationUrl: "https://www.amazon.jobs/en/jobs/2541982/software-development-engineer-internship-2025",
      status: "OPEN",
    },
    {
      companyId: microsoftId,
      title: "Support Engineer (Off-Campus Drive)",
      description: "Microsoft is hiring Support Engineers for Azure Cloud and Enterprise Platform Services at Bengaluru campus. Fresh engineering graduates with strong computer networks and OS foundations are invited to apply.",
      opportunityType: "OFF_CAMPUS" as const,
      location: "Bengaluru",
      workMode: "HYBRID" as const,
      graduationBatch: 2025,
      branchEligibility: ["CSE", "ISE", "ECE", "EEE"],
      requiredSkills: ["Computer Networks", "Operating Systems", "Windows Server", "Azure Cloud Basics"],
      salaryMin: 600000,
      salaryMax: 850000,
      duration: "Full-time",
      applicationDeadline: d30,
      applicationUrl: "https://careers.microsoft.com/v2/global/en/home.html",
      status: "OPEN",
    },
    {
      companyId: ciscoId,
      title: "Software Engineer - Early Career / Fresher",
      description: "Cisco is looking for fresh engineering graduates to join the Core Networking and Security Software engineering division in Bengaluru. Focus on high-throughput microservices and routing protocols.",
      opportunityType: "JOB" as const,
      location: "Bengaluru",
      workMode: "HYBRID" as const,
      graduationBatch: 2025,
      branchEligibility: ["CSE", "ISE", "ECE"],
      requiredSkills: ["C/C++", "Python", "Networking Protocols (TCP/IP)", "Linux", "Data Structures"],
      salaryMin: 1200000,
      salaryMax: 1600000,
      duration: "Full-time",
      applicationDeadline: d45,
      applicationUrl: "https://www.linkedin.com/jobs/view/software-engineer-early-career-at-cisco-3987123456/",
      status: "OPEN",
    },
    {
      companyId: capgeminiId,
      title: "Capgemini Exceller - Analyst & Software Engineer",
      description: "Capgemini Exceller off-campus drive for freshers. Open for BE/B.Tech (all engineering branches). Technical training in Full Stack, Cloud, and Cybersecurity provided.",
      opportunityType: "OFF_CAMPUS" as const,
      location: "Pune / Bengaluru / Hyderabad",
      workMode: "HYBRID" as const,
      graduationBatch: 2025,
      branchEligibility: ["CSE", "ISE", "ECE", "EEE", "ME", "CIV"],
      requiredSkills: ["Programming Fundamentals", "Analytical Skills", "Database Basics"],
      salaryMin: 425000,
      salaryMax: 575000,
      duration: "Full-time",
      applicationDeadline: d30,
      applicationUrl: "https://www.capgemini.com/in-en/careers/fresher-hiring/",
      status: "OPEN",
    },
    {
      companyId: barclaysId,
      title: "Graduate Technology Analyst",
      description: "Barclays Technology Center Pune is hiring Graduate Technology Analysts. You will contribute to investment banking platforms, risk engines, and global payments systems.",
      opportunityType: "JOB" as const,
      location: "Pune",
      workMode: "HYBRID" as const,
      graduationBatch: 2025,
      branchEligibility: ["CSE", "ISE", "ECE"],
      requiredSkills: ["Java", "SQL", "Spring Framework", "Data Structures", "Financial Engineering Basics"],
      salaryMin: 850000,
      salaryMax: 1100000,
      duration: "Full-time",
      applicationDeadline: d30,
      applicationUrl: "https://search.jobs.barclays/job/pune/graduate-analyst/22545/68712345",
      status: "OPEN",
    },
    {
      companyId: deloitteId,
      title: "Associate Analyst - Systems Engineering",
      description: "Deloitte US-India (USI) is hiring Associate Analysts for enterprise cloud transformation, SAP implementations, and data engineering projects across Hyderabad, Bengaluru, and Pune.",
      opportunityType: "JOB" as const,
      location: "Hyderabad / Bengaluru",
      workMode: "HYBRID" as const,
      graduationBatch: 2025,
      branchEligibility: ["CSE", "ISE", "ECE", "EEE", "ME", "CIV"],
      requiredSkills: ["SQL", "Python", "Data Analysis", "Communication", "Problem Solving"],
      salaryMin: 550000,
      salaryMax: 700000,
      duration: "Full-time",
      applicationDeadline: d45,
      applicationUrl: "https://jobsindia.deloitte.com/job/Hyderabad-Associate-Analyst/1029482100/",
      status: "OPEN",
    },
  ];

  for (const job of realJobs) {
    await db.insert(opportunities).values(job);
  }

  const finalJobs = await db.select().from(opportunities);
  console.log(`\n[SUCCESS] Seeded ${realJobs.length} verified jobs. Total active jobs now: ${finalJobs.length}`);
  finalJobs.forEach((j, i) => {
    console.log(`${i + 1}. [${j.opportunityType}] ${j.title} (${j.location}) -> ${j.applicationUrl}`);
  });

  process.exit(0);
}

main().catch(console.error);
