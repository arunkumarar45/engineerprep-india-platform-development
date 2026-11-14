"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Award,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Code2,
  Download,
  ExternalLink,
  GraduationCap,
  Info,
  Mail,
  MapPin,
  Phone,
  Plus,
  Printer,
  RotateCcw,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";
import { Badge, Button, Card, ProgressBar } from "@/components/ui";
import { cn } from "@/lib/utils";

export type ResumeData = {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  portfolio: string;
  summary: string;
  education: Array<{
    id: string;
    institution: string;
    degree: string;
    branch: string;
    year: string;
    score: string;
  }>;
  skills: {
    languages: string;
    frameworks: string;
    tools: string;
    coreCS: string;
  };
  projects: Array<{
    id: string;
    title: string;
    techStack: string;
    link: string;
    bullets: string;
  }>;
  experience: Array<{
    id: string;
    company: string;
    role: string;
    duration: string;
    location: string;
    bullets: string;
  }>;
  achievements: Array<{
    id: string;
    text: string;
  }>;
};

const DEFAULT_RESUME: ResumeData = {
  fullName: "Arun Kumar",
  email: "arunkumar@example.com",
  phone: "+91 98765 43210",
  location: "Bengaluru, Karnataka",
  linkedin: "linkedin.com/in/arunkumar",
  github: "github.com/arunkumar",
  portfolio: "arunkumar.dev",
  summary:
    "Final-year Computer Science Engineering student passionate about full-stack web development and distributed systems. Strong foundation in Data Structures, Algorithms, and clean code principles with proven hands-on project experience in Next.js, Node.js, and PostgreSQL.",
  education: [
    {
      id: "edu-1",
      institution: "Visvesvaraya Technological University (VTU)",
      degree: "Bachelor of Engineering (B.E.)",
      branch: "Computer Science & Engineering",
      year: "2021 – 2025",
      score: "CGPA: 8.75 / 10",
    },
    {
      id: "edu-2",
      institution: "Karnataka Pre-University Board",
      degree: "Pre-University Course (PCMB)",
      branch: "Science",
      year: "2019 – 2021",
      score: "Percentage: 92.4%",
    },
  ],
  skills: {
    languages: "JavaScript, TypeScript, C++, Python, SQL",
    frameworks: "React, Next.js, Node.js, Express, Tailwind CSS",
    tools: "Git, GitHub, Docker, Redis, PostgreSQL, Postman, Linux",
    coreCS: "Data Structures & Algorithms, DBMS, Operating Systems, Computer Networks, OOPs",
  },
  projects: [
    {
      id: "proj-1",
      title: "EngineerPrep India — Engineering Platform",
      techStack: "Next.js 16, TypeScript, PostgreSQL, Drizzle ORM, Tailwind CSS",
      link: "https://engineerprep.in",
      bullets:
        "• Architected a full-stack student preparation platform serving 5,000+ engineering students.\n• Implemented relational PostgreSQL schemas, BullMQ background queues, and Redis rate limiting reducing query latency by 45%.\n• Built interactive DSA pattern trackers and automated VTU circular synchronization.",
    },
    {
      id: "proj-2",
      title: "Distributed Task Scheduler & Worker Pool",
      techStack: "Node.js, Redis, Docker, TypeScript",
      link: "https://github.com/arunkumar/task-scheduler",
      bullets:
        "• Designed an event-driven task distribution engine supporting sliding-window rate limiting and exponential backoff.\n• Processed 10,000+ simulated jobs per minute with zero task loss and automated failure recovery telemetry.",
    },
  ],
  experience: [
    {
      id: "exp-1",
      company: "Tech Mahindra",
      role: "Software Engineering Intern",
      duration: "Jun 2024 – Aug 2024",
      location: "Bengaluru, India",
      bullets:
        "• Developed reusable React components and integrated RESTful APIs for internal developer dashboards.\n• Optimized SQL query join execution plans, improving page load speeds by 30% across 12 dashboard views.\n• Participated in agile sprints, peer code reviews, and automated CI/CD pipeline deployments.",
    },
  ],
  achievements: [
    {
      id: "ach-1",
      text: "Solved 400+ problems across LeetCode & GeeksforGeeks (Top 15% global rating).",
    },
    {
      id: "ach-2",
      text: "Winner — 1st Place in Inter-College VTU Hackathon 2024 among 60+ teams.",
    },
    {
      id: "ach-3",
      text: "AWS Certified Cloud Practitioner (Dec 2023).",
    },
  ],
};

const ACTION_VERBS = [
  "architected",
  "built",
  "developed",
  "engineered",
  "implemented",
  "optimized",
  "designed",
  "deployed",
  "scaled",
  "created",
  "automated",
  "spearheaded",
  "reduced",
  "improved",
];

export function ResumeBuilder() {
  const [resume, setResume] = useState<ResumeData>(DEFAULT_RESUME);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  // Load from local storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("epi_resume_data");
      if (saved) {
        setResume(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const saveResume = (updated: ResumeData) => {
    setResume(updated);
    try {
      localStorage.setItem("epi_resume_data", JSON.stringify(updated));
    } catch {}
  };

  const resetToSample = () => {
    if (confirm("Reset resume to standard high-scoring engineering template?")) {
      saveResume(DEFAULT_RESUME);
    }
  };

  // Real-time ATS score calculation
  const atsAnalysis = useMemo(() => {
    let score = 0;
    const items: Array<{ label: string; passed: boolean; score: number; max: number; tip: string }> = [];

    // 1. Contact details (15 pts)
    const hasEmail = Boolean(resume.email && resume.email.includes("@"));
    const hasPhone = Boolean(resume.phone && resume.phone.length >= 10);
    const hasLinkedin = Boolean(resume.linkedin && resume.linkedin.toLowerCase().includes("linkedin"));
    const hasGithub = Boolean(resume.github && resume.github.toLowerCase().includes("github"));
    const contactScore = (hasEmail ? 4 : 0) + (hasPhone ? 4 : 0) + (hasLinkedin ? 4 : 0) + (hasGithub ? 3 : 0);
    score += contactScore;
    items.push({
      label: "Contact & Online Profiles",
      passed: contactScore >= 12,
      score: contactScore,
      max: 15,
      tip: "Include Email, Phone, LinkedIn, and GitHub links in your header.",
    });

    // 2. Summary (10 pts)
    const summaryLength = resume.summary.trim().split(/\s+/).filter(Boolean).length;
    const summaryScore = summaryLength >= 25 && summaryLength <= 80 ? 10 : summaryLength > 0 ? 5 : 0;
    score += summaryScore;
    items.push({
      label: "Professional Summary",
      passed: summaryScore === 10,
      score: summaryScore,
      max: 10,
      tip: "Keep summary between 25 and 80 words highlighting branch, key skills, and passion.",
    });

    // 3. Education (15 pts)
    const hasEdu = resume.education.length > 0 && resume.education[0].institution.trim() !== "";
    const hasDegree = resume.education.some((e) => e.degree.trim() !== "");
    const hasScore = resume.education.some((e) => e.score.trim() !== "");
    const eduScore = (hasEdu ? 5 : 0) + (hasDegree ? 5 : 0) + (hasScore ? 5 : 0);
    score += eduScore;
    items.push({
      label: "Education Details",
      passed: eduScore === 15,
      score: eduScore,
      max: 15,
      tip: "Mention College/University name, B.E./B.Tech branch, graduation year, and CGPA.",
    });

    // 4. Skills Categorization (20 pts)
    const skillCount = [
      resume.skills.languages,
      resume.skills.frameworks,
      resume.skills.tools,
      resume.skills.coreCS,
    ].filter((s) => s.trim().length > 0).length;
    const skillsScore = skillCount === 4 ? 20 : skillCount * 4;
    score += skillsScore;
    items.push({
      label: "Categorized Technical Skills",
      passed: skillsScore === 20,
      score: skillsScore,
      max: 20,
      tip: "Categorize skills: Languages, Frameworks, Tools/Cloud, and Core CS (DBMS, OS, CN).",
    });

    // 5. Technical Projects (25 pts)
    const projCount = resume.projects.length;
    const projectBullets = resume.projects.map((p) => p.bullets.toLowerCase()).join(" ");
    const hasVerbs = ACTION_VERBS.some((v) => projectBullets.includes(v));
    const hasMetrics = /\d+%|\d+k|\d+ms|\d+\+/.test(projectBullets);

    let projScore = Math.min(10, projCount * 5);
    if (hasVerbs) projScore += 8;
    if (hasMetrics) projScore += 7;
    score += projScore;
    items.push({
      label: "Projects with Action Verbs & Metrics",
      passed: projScore >= 20,
      score: projScore,
      max: 25,
      tip: "Use strong action verbs (Architected, Built, Optimized) and quantifiable metrics (e.g. 45%, 10k users).",
    });

    // 6. Experience or Achievements (15 pts)
    const hasExp = resume.experience.length > 0 && resume.experience[0].company.trim() !== "";
    const hasAch = resume.achievements.length > 0 && resume.achievements[0].text.trim() !== "";
    const expScore = (hasExp ? 8 : 0) + (hasAch ? 7 : 0);
    score += expScore;
    items.push({
      label: "Experience & Achievements",
      passed: expScore >= 12,
      score: expScore,
      max: 15,
      tip: "Add internship experience, hackathon wins, competitive programming ratings, or certifications.",
    });

    return { total: Math.min(100, score), items };
  }, [resume]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6" suppressHydrationWarning>
      {/* Top Banner & ATS Score Summary */}
      <Card className="p-5 border-l-4 border-l-brand-500">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-extrabold text-ink-900">
                Interactive Engineering Resume Builder
              </h2>
              <Badge
                tone={
                  atsAnalysis.total >= 85
                    ? "success"
                    : atsAnalysis.total >= 70
                      ? "brand"
                      : "warning"
                }
                className="text-xs font-bold"
              >
                ATS Score: {atsAnalysis.total} / 100
              </Badge>
            </div>
            <p className="text-xs text-ink-500 max-w-2xl">
              ATS-optimized engineering resume format trusted by top recruiters at TCS, Infosys,
              Cognizant, Amazon, and Microsoft. Real-time checklist ensures your resume passes automated
              screeners.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetToSample}
              className="text-xs"
            >
              <RotateCcw className="size-3.5" /> Sample Profile
            </Button>
            <Button
              variant={activeTab === "edit" ? "primary" : "outline"}
              size="sm"
              onClick={() => setActiveTab("edit")}
              className="text-xs"
            >
              Edit Form
            </Button>
            <Button
              variant={activeTab === "preview" ? "primary" : "outline"}
              size="sm"
              onClick={() => setActiveTab("preview")}
              className="text-xs"
            >
              Live Preview
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handlePrint}
              className="text-xs bg-brand-600 hover:bg-brand-700"
            >
              <Printer className="size-3.5" /> Print / Export PDF
            </Button>
          </div>
        </div>

        {/* ATS Metric Breakdown */}
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pt-4 border-t border-line">
          {atsAnalysis.items.map((item, idx) => (
            <div
              key={idx}
              className={cn(
                "rounded-lg border p-2.5 text-xs transition",
                item.passed
                  ? "border-success-500/30 bg-success-500/5 text-ink-800"
                  : "border-warning-500/30 bg-warning-500/5 text-ink-800",
              )}
            >
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2
                    className={cn(
                      "size-3.5",
                      item.passed ? "text-success-600" : "text-ink-400",
                    )}
                  />
                  {item.label}
                </span>
                <span className="tabular-nums text-ink-600">
                  {item.score}/{item.max}
                </span>
              </div>
              {!item.passed && (
                <p className="mt-1 text-[0.68rem] text-warning-700 leading-tight">
                  💡 {item.tip}
                </p>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Main Content Area */}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        {/* EDIT FORM (Hidden on print) */}
        <div className={cn("space-y-5 print:hidden", activeTab === "preview" && "hidden lg:block")}>
          {/* 1. Header Information */}
          <Card className="p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-500 flex items-center gap-2">
              <User className="size-3.5" /> 1. Personal & Contact Information
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-[0.7rem] font-semibold text-ink-600">Full Name</label>
                <input
                  type="text"
                  value={resume.fullName}
                  onChange={(e) => saveResume({ ...resume, fullName: e.target.value })}
                  className="mt-1 w-full rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs text-ink-900"
                />
              </div>
              <div>
                <label className="text-[0.7rem] font-semibold text-ink-600">Email Address</label>
                <input
                  type="email"
                  value={resume.email}
                  onChange={(e) => saveResume({ ...resume, email: e.target.value })}
                  className="mt-1 w-full rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs text-ink-900"
                />
              </div>
              <div>
                <label className="text-[0.7rem] font-semibold text-ink-600">Phone Number</label>
                <input
                  type="text"
                  value={resume.phone}
                  onChange={(e) => saveResume({ ...resume, phone: e.target.value })}
                  className="mt-1 w-full rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs text-ink-900"
                />
              </div>
              <div>
                <label className="text-[0.7rem] font-semibold text-ink-600">City, State</label>
                <input
                  type="text"
                  value={resume.location}
                  onChange={(e) => saveResume({ ...resume, location: e.target.value })}
                  className="mt-1 w-full rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs text-ink-900"
                />
              </div>
              <div>
                <label className="text-[0.7rem] font-semibold text-ink-600">LinkedIn URL</label>
                <input
                  type="text"
                  value={resume.linkedin}
                  onChange={(e) => saveResume({ ...resume, linkedin: e.target.value })}
                  className="mt-1 w-full rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs text-ink-900"
                />
              </div>
              <div>
                <label className="text-[0.7rem] font-semibold text-ink-600">GitHub Profile</label>
                <input
                  type="text"
                  value={resume.github}
                  onChange={(e) => saveResume({ ...resume, github: e.target.value })}
                  className="mt-1 w-full rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs text-ink-900"
                />
              </div>
            </div>

            <div>
              <label className="text-[0.7rem] font-semibold text-ink-600">Professional Summary</label>
              <textarea
                rows={2}
                value={resume.summary}
                onChange={(e) => saveResume({ ...resume, summary: e.target.value })}
                className="mt-1 w-full rounded-md border border-line bg-surface p-2 text-xs text-ink-900 leading-relaxed"
              />
            </div>
          </Card>

          {/* 2. Technical Skills */}
          <Card className="p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-500 flex items-center gap-2">
              <Code2 className="size-3.5" /> 2. Technical Skills
            </h3>
            <div className="space-y-2.5">
              <div>
                <label className="text-[0.7rem] font-semibold text-ink-600">Programming Languages</label>
                <input
                  type="text"
                  value={resume.skills.languages}
                  onChange={(e) =>
                    saveResume({
                      ...resume,
                      skills: { ...resume.skills, languages: e.target.value },
                    })
                  }
                  className="mt-1 w-full rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs text-ink-900"
                />
              </div>
              <div>
                <label className="text-[0.7rem] font-semibold text-ink-600">Frameworks & Libraries</label>
                <input
                  type="text"
                  value={resume.skills.frameworks}
                  onChange={(e) =>
                    saveResume({
                      ...resume,
                      skills: { ...resume.skills, frameworks: e.target.value },
                    })
                  }
                  className="mt-1 w-full rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs text-ink-900"
                />
              </div>
              <div>
                <label className="text-[0.7rem] font-semibold text-ink-600">Developer Tools & Databases</label>
                <input
                  type="text"
                  value={resume.skills.tools}
                  onChange={(e) =>
                    saveResume({
                      ...resume,
                      skills: { ...resume.skills, tools: e.target.value },
                    })
                  }
                  className="mt-1 w-full rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs text-ink-900"
                />
              </div>
              <div>
                <label className="text-[0.7rem] font-semibold text-ink-600">Core CS Concepts</label>
                <input
                  type="text"
                  value={resume.skills.coreCS}
                  onChange={(e) =>
                    saveResume({
                      ...resume,
                      skills: { ...resume.skills, coreCS: e.target.value },
                    })
                  }
                  className="mt-1 w-full rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs text-ink-900"
                />
              </div>
            </div>
          </Card>

          {/* 3. Projects */}
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-500 flex items-center gap-2">
                <BookOpen className="size-3.5" /> 3. Technical Projects
              </h3>
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-[0.65rem] px-2"
                onClick={() =>
                  saveResume({
                    ...resume,
                    projects: [
                      ...resume.projects,
                      {
                        id: `proj-${Date.now()}`,
                        title: "New Project",
                        techStack: "Tech Stack",
                        link: "",
                        bullets: "• Describe project scope and quantifiable achievements.\n• Use strong action verbs.",
                      },
                    ],
                  })
                }
              >
                <Plus className="size-3" /> Add Project
              </Button>
            </div>

            {resume.projects.map((proj, pIdx) => (
              <div key={proj.id} className="rounded-lg border border-line p-3 space-y-2 bg-surface-elevated/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink-800">Project #{pIdx + 1}</span>
                  {resume.projects.length > 1 && (
                    <button
                      onClick={() =>
                        saveResume({
                          ...resume,
                          projects: resume.projects.filter((p) => p.id !== proj.id),
                        })
                      }
                      className="text-ink-400 hover:text-error-600 text-xs"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    type="text"
                    placeholder="Project Title"
                    value={proj.title}
                    onChange={(e) => {
                      const updated = [...resume.projects];
                      updated[pIdx].title = e.target.value;
                      saveResume({ ...resume, projects: updated });
                    }}
                    className="w-full rounded-md border border-line bg-surface px-2 py-1 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Tech Stack (e.g. Next.js, Node.js, SQL)"
                    value={proj.techStack}
                    onChange={(e) => {
                      const updated = [...resume.projects];
                      updated[pIdx].techStack = e.target.value;
                      saveResume({ ...resume, projects: updated });
                    }}
                    className="w-full rounded-md border border-line bg-surface px-2 py-1 text-xs"
                  />
                </div>
                <textarea
                  rows={3}
                  placeholder="Bullet points (one per line, starting with •)"
                  value={proj.bullets}
                  onChange={(e) => {
                    const updated = [...resume.projects];
                    updated[pIdx].bullets = e.target.value;
                    saveResume({ ...resume, projects: updated });
                  }}
                  className="w-full rounded-md border border-line bg-surface p-2 text-xs leading-relaxed"
                />
              </div>
            ))}
          </Card>

          {/* 4. Experience */}
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-500 flex items-center gap-2">
                <Briefcase className="size-3.5" /> 4. Work Experience & Internships
              </h3>
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-[0.65rem] px-2"
                onClick={() =>
                  saveResume({
                    ...resume,
                    experience: [
                      ...resume.experience,
                      {
                        id: `exp-${Date.now()}`,
                        company: "Company Name",
                        role: "Intern",
                        duration: "Month Year – Month Year",
                        location: "City, Country",
                        bullets: "• Implemented features and collaborated with team.",
                      },
                    ],
                  })
                }
              >
                <Plus className="size-3" /> Add Experience
              </Button>
            </div>

            {resume.experience.map((exp, eIdx) => (
              <div key={exp.id} className="rounded-lg border border-line p-3 space-y-2 bg-surface-elevated/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink-800">Experience #{eIdx + 1}</span>
                  <button
                    onClick={() =>
                      saveResume({
                        ...resume,
                        experience: resume.experience.filter((e) => e.id !== exp.id),
                      })
                    }
                    className="text-ink-400 hover:text-error-600 text-xs"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    type="text"
                    placeholder="Company Name"
                    value={exp.company}
                    onChange={(e) => {
                      const updated = [...resume.experience];
                      updated[eIdx].company = e.target.value;
                      saveResume({ ...resume, experience: updated });
                    }}
                    className="w-full rounded-md border border-line bg-surface px-2 py-1 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Role (e.g. SDE Intern)"
                    value={exp.role}
                    onChange={(e) => {
                      const updated = [...resume.experience];
                      updated[eIdx].role = e.target.value;
                      saveResume({ ...resume, experience: updated });
                    }}
                    className="w-full rounded-md border border-line bg-surface px-2 py-1 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Duration"
                    value={exp.duration}
                    onChange={(e) => {
                      const updated = [...resume.experience];
                      updated[eIdx].duration = e.target.value;
                      saveResume({ ...resume, experience: updated });
                    }}
                    className="w-full rounded-md border border-line bg-surface px-2 py-1 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Location"
                    value={exp.location}
                    onChange={(e) => {
                      const updated = [...resume.experience];
                      updated[eIdx].location = e.target.value;
                      saveResume({ ...resume, experience: updated });
                    }}
                    className="w-full rounded-md border border-line bg-surface px-2 py-1 text-xs"
                  />
                </div>
                <textarea
                  rows={2}
                  placeholder="Bullet points"
                  value={exp.bullets}
                  onChange={(e) => {
                    const updated = [...resume.experience];
                    updated[eIdx].bullets = e.target.value;
                    saveResume({ ...resume, experience: updated });
                  }}
                  className="w-full rounded-md border border-line bg-surface p-2 text-xs leading-relaxed"
                />
              </div>
            ))}
          </Card>
        </div>

        {/* LIVE RESUME PREVIEW & PRINT TARGET */}
        <div className={cn("space-y-4", activeTab === "edit" && "hidden lg:block")}>
          <div className="flex items-center justify-between text-xs text-ink-500 font-medium px-1 print:hidden">
            <span>A4 Document Preview (ATS Compliant)</span>
            <span className="text-brand-600 font-bold">1 Page Standard</span>
          </div>

          <div
            id="printable-resume"
            className="rounded-xl border border-line bg-white text-ink-950 p-4 sm:p-8 shadow-sm transition space-y-4 overflow-x-auto print:p-0 print:border-none print:shadow-none"
            style={{ minHeight: "297mm", fontFamily: "Georgia, Cambria, 'Times New Roman', serif" }}
          >
            {/* Header */}
            <div className="text-center border-b border-ink-300 pb-3">
              <h1 className="text-2xl font-bold tracking-wide text-ink-900 uppercase">
                {resume.fullName || "Your Full Name"}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center justify-center gap-2.5 text-[0.72rem] text-ink-700">
                {resume.phone && <span>{resume.phone}</span>}
                {resume.email && <span>• {resume.email}</span>}
                {resume.location && <span>• {resume.location}</span>}
                {resume.linkedin && (
                  <span>
                    • <a href={`https://${resume.linkedin}`} className="text-ink-800 underline">{resume.linkedin}</a>
                  </span>
                )}
                {resume.github && (
                  <span>
                    • <a href={`https://${resume.github}`} className="text-ink-800 underline">{resume.github}</a>
                  </span>
                )}
              </div>
            </div>

            {/* Summary */}
            {resume.summary && (
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-ink-900 border-b border-ink-200 pb-0.5">
                  Professional Summary
                </h2>
                <p className="mt-1 text-[0.75rem] text-ink-800 leading-relaxed text-justify">
                  {resume.summary}
                </p>
              </div>
            )}

            {/* Education */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-ink-900 border-b border-ink-200 pb-0.5">
                Education
              </h2>
              <div className="mt-1.5 space-y-2">
                {resume.education.map((edu) => (
                  <div key={edu.id} className="text-[0.75rem]">
                    <div className="flex items-center justify-between font-bold text-ink-900">
                      <span>{edu.institution}</span>
                      <span className="font-normal text-ink-700">{edu.year}</span>
                    </div>
                    <div className="flex items-center justify-between text-ink-800">
                      <span>{edu.degree} — {edu.branch}</span>
                      <span className="font-semibold text-ink-900">{edu.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Technical Skills */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-ink-900 border-b border-ink-200 pb-0.5">
                Technical Skills
              </h2>
              <div className="mt-1.5 space-y-1 text-[0.75rem]">
                {resume.skills.languages && (
                  <p>
                    <strong className="text-ink-900">Languages:</strong> {resume.skills.languages}
                  </p>
                )}
                {resume.skills.frameworks && (
                  <p>
                    <strong className="text-ink-900">Frameworks & Libraries:</strong> {resume.skills.frameworks}
                  </p>
                )}
                {resume.skills.tools && (
                  <p>
                    <strong className="text-ink-900">Developer Tools & Databases:</strong> {resume.skills.tools}
                  </p>
                )}
                {resume.skills.coreCS && (
                  <p>
                    <strong className="text-ink-900">Core Concepts:</strong> {resume.skills.coreCS}
                  </p>
                )}
              </div>
            </div>

            {/* Projects */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-ink-900 border-b border-ink-200 pb-0.5">
                Academic & Technical Projects
              </h2>
              <div className="mt-2 space-y-2.5">
                {resume.projects.map((proj) => (
                  <div key={proj.id} className="text-[0.75rem]">
                    <div className="flex items-center justify-between font-bold text-ink-900">
                      <span>
                        {proj.title}{" "}
                        <span className="font-normal text-ink-600">| {proj.techStack}</span>
                      </span>
                    </div>
                    <div className="mt-0.5 whitespace-pre-line text-ink-800 leading-snug">
                      {proj.bullets}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Experience */}
            {resume.experience.length > 0 && resume.experience[0].company && (
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-ink-900 border-b border-ink-200 pb-0.5">
                  Experience & Internships
                </h2>
                <div className="mt-2 space-y-2">
                  {resume.experience.map((exp) => (
                    <div key={exp.id} className="text-[0.75rem]">
                      <div className="flex items-center justify-between font-bold text-ink-900">
                        <span>{exp.company} — <span className="font-normal italic">{exp.role}</span></span>
                        <span className="font-normal text-ink-700">{exp.duration}</span>
                      </div>
                      <div className="mt-0.5 whitespace-pre-line text-ink-800 leading-snug">
                        {exp.bullets}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Achievements */}
            {resume.achievements.length > 0 && (
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-ink-900 border-b border-ink-200 pb-0.5">
                  Achievements & Certifications
                </h2>
                <ul className="mt-1 list-disc pl-4 text-[0.75rem] text-ink-800 space-y-0.5">
                  {resume.achievements.map((ach) => (
                    <li key={ach.id}>{ach.text}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

