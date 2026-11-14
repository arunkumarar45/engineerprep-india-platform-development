import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "EngineerPrep India – VTU Notes, DSA & Placement Preparation",
  description:
    "EngineerPrep India helps engineering students prepare for VTU exams and placements with subject-wise notes, previous-year question papers, syllabus PDFs, DSA practice, interview preparation and fresher job opportunities.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "EngineerPrep India – VTU Notes, DSA & Placement Preparation",
    description:
      "EngineerPrep India helps engineering students prepare for VTU exams and placements with subject-wise notes, previous-year question papers, syllabus PDFs, DSA practice, interview preparation and fresher job opportunities.",
    url: "/",
    siteName: "EngineerPrep India",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EngineerPrep India – VTU Notes, DSA & Placement Preparation",
    description:
      "EngineerPrep India helps engineering students prepare for VTU exams and placements with subject-wise notes, previous-year question papers, syllabus PDFs, DSA practice, interview preparation and fresher job opportunities.",
  },
};
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Code2,
  FileStack,
  Flame,
  GraduationCap,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { Brandmark, MobileHeaderBrandmark } from "@/components/brand/Logo";
import { Footer } from "@/components/layout";
import { getResourceStats } from "@/lib/queries";
import { getSessionUser } from "@/lib/auth";

const ENTRY_CARDS = [
  {
    title: "VTU Notes & Resources",
    description:
      "VTU updates, notes, question papers, syllabus and study materials.",
    cta: "Explore VTU Resources",
    href: "/vtu",
    icon: BookOpen,
    tint: "#FF5A00",
  },
  {
    title: "Placement Guides",
    description:
      "DSA, roadmaps, aptitude, technical subjects, company preparation and mock tests.",
    cta: "Start Preparation",
    href: "/placements",
    icon: Code2,
    tint: "#2B6CB0",
  },
  {
    title: "Jobs & Internships",
    description:
      "Latest jobs, internships, off-campus drives and application tracker.",
    cta: "Explore Opportunities",
    href: "/jobs",
    icon: Briefcase,
    tint: "#22A06B",
  },
];

// Stats are computed from live DB in the page component below

const HIGHLIGHTS = [
  {
    title: "DSA Sheets from top educators",
    body: "Striver A2Z, Love Babbar, NeetCode and more — with progress tracking that resumes where you left off.",
    href: "/placements/dsa-sheets",
    icon: Sparkles,
    tint: "#FF5A00",
  },
  {
    title: "Role-wise developer roadmaps",
    body: "Full stack, backend, DevOps, AI/ML and cloud paths with stages, topics and completion checkboxes.",
    href: "/placements/roadmaps",
    icon: TrendingUp,
    tint: "#7C3AED",
  },
  {
    title: "Mock tests with real scoring",
    body: "Timed aptitude and technical assessments with server-side scoring, topic analysis and answer review.",
    href: "/placements/mock-tests",
    icon: GraduationCap,
    tint: "#22A06B",
  },
];

export default async function HomePage() {
  const user = await getSessionUser();
  const stats = await getResourceStats();

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-3 sm:px-4 lg:px-6">
          <div className="flex shrink-0 items-center">
            <div className="block sm:hidden">
              <MobileHeaderBrandmark />
            </div>
            <div className="hidden sm:block">
              <Brandmark />
            </div>
          </div>
          <nav className="ml-4 hidden items-center gap-0.5 lg:flex">
            {[
              { label: "Home", href: "/" },
              { label: "VTU Notes", href: "/vtu" },
              { label: "Placements", href: "/placements" },
              { label: "Jobs", href: "/jobs" },
              { label: "Resources", href: "/vtu/resources" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-lg px-2.5 py-2 text-sm font-semibold text-ink-700 transition-colors hover:bg-brand-50 hover:text-brand-600"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            {user ? (
              <Link
                href="/dashboard"
                className="rounded-xl bg-brand-500 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-brand-600"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-xl px-2.5 py-1.5 text-xs font-bold text-ink-700 hover:bg-brand-50 hover:text-brand-600 sm:px-3 sm:py-2 sm:text-sm"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="inline-flex h-9 items-center rounded-xl bg-brand-500 px-3 text-xs font-bold text-white shadow-sm transition-colors hover:bg-brand-600 sm:px-3.5"
                >
                  Create account
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="border-b border-line bg-white">
          <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-12 lg:grid-cols-[1.15fr_1fr] lg:px-6 lg:py-16">
            <div>
              <Badge tone="brand" className="mb-4">
                <Sparkles className="size-3" /> Built for VTU engineering students
              </Badge>
              <h1 className="text-[2rem] font-extrabold leading-[1.12] tracking-tight text-ink-900 sm:text-[2.6rem] lg:text-[3rem]">
                EngineerPrep India – <span className="text-brand-500">Your Engineering Learning and Placement Platform</span>
              </h1>
              <p className="mt-4 max-w-xl text-[0.95rem] leading-relaxed text-ink-500">
                EngineerPrep India helps engineering students prepare for VTU exams and campus placements with verified subject-wise notes, previous-year question papers, syllabus PDFs, DSA sheet tracking, and fresher job opportunities.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href="/placements/dsa-sheets"
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-500 px-5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(255,90,0,0.28)] transition-colors hover:bg-brand-600"
                >
                  Start Preparation <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/vtu"
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-line bg-white px-5 text-sm font-bold text-ink-900 transition-colors hover:border-brand-300 hover:text-brand-600"
                >
                  Browse VTU Notes
                </Link>
              </div>
            </div>
            <div className="relative">
              <div
                className="absolute inset-6 rounded-full opacity-70 blur-3xl"
                style={{
                  background:
                    "radial-gradient(circle at 50% 50%, rgba(255,90,0,0.22), transparent 65%)",
                }}
                aria-hidden
              />
              <Image
                src="/images/hero-student.png"
                alt="Engineering student preparing with EngineerPrep India"
                width={640}
                height={520}
                priority
                className="relative mx-auto h-auto w-full max-w-md drop-shadow-[0_24px_48px_rgba(23,33,43,0.14)]"
              />
            </div>
          </div>
        </section>

        {/* Three entry containers */}
        <section className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
          <div className="grid gap-5 md:grid-cols-3">
            {ENTRY_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <Card
                  key={card.title}
                  hover
                  className="group flex flex-col p-6"
                >
                  <span
                    className="grid size-12 place-items-center rounded-xl text-white shadow-[0_10px_24px_rgba(23,33,43,0.16)]"
                    style={{ background: card.tint }}
                  >
                    <Icon className="size-6" />
                  </span>
                  <h2 className="mt-4 text-base font-extrabold text-ink-900">
                    {card.title}
                  </h2>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-500">
                    {card.description}
                  </p>
                  <Link
                    href={card.href}
                    className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-500 text-sm font-bold text-white transition-colors hover:bg-brand-600"
                  >
                    {card.cta} <ArrowRight className="size-4" />
                  </Link>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Stats */}
        <section className="border-y border-line bg-white">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-8 sm:grid-cols-3 lg:grid-cols-5 lg:gap-5 lg:px-6 lg:py-10">
            {[
              { value: `${(stats.NOTES || 0).toLocaleString()}+`, label: "Study Notes", icon: FileStack },
              { value: `${(stats.QUESTION_PAPER || 0).toLocaleString()}+`, label: "Question Papers", icon: Code2 },
              { value: `${(stats.SYLLABUS || 0).toLocaleString()}+`, label: "Syllabus Docs", icon: BookOpen },
              { value: "48+", label: "Verified Courses", icon: Sparkles },
              { value: "Daily", label: "VTU Updates", icon: Flame },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className={`flex items-center gap-3 ${i === 4 ? "col-span-2 sm:col-span-1" : ""}`}
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-500">
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <p className="text-xl font-extrabold leading-none text-ink-900">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-ink-500">
                      {stat.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Highlights */}
        <section className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-ink-900">
                What you can do today
              </h2>
              <p className="mt-1 text-sm text-ink-500">
                {stats.NOTES.toLocaleString()} notes, {stats.QUESTION_PAPER.toLocaleString()} question
                papers and {stats.SYLLABUS.toLocaleString()} syllabus documents are already indexed.
              </p>
            </div>
            <Link
              href="/placements"
              className="text-sm font-bold text-brand-600 hover:underline"
            >
              View all preparation guides →
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {HIGHLIGHTS.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.title} href={item.href} className="group">
                  <Card hover className="h-full p-5">
                    <span
                      className="grid size-10 place-items-center rounded-lg text-white"
                      style={{ background: item.tint }}
                    >
                      <Icon className="size-5" />
                    </span>
                    <h3 className="mt-3.5 text-sm font-bold text-ink-900 group-hover:text-brand-600">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-ink-500">
                      {item.body}
                    </p>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Informative Platform Overview for Students & Search */}
        <section className="border-t border-line bg-surface py-14">
          <div className="mx-auto max-w-7xl px-4 lg:px-6">
            <div className="max-w-3xl">
              <h2 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
                Comprehensive VTU Exam &amp; Tech Placement Preparation
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-600 sm:text-base">
                EngineerPrep India is engineered to bridge the gap between semester academic examinations and competitive technology campus recruitment. Here is how our free resources empower your college journey:
              </p>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-3">
              <div className="rounded-xl border border-line bg-white p-6 shadow-sm">
                <h3 className="text-base font-bold text-ink-900">
                  1. Official VTU Curriculum Resources
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-ink-600">
                  Access module-wise lecture notes, official teaching schemes, and authentic model question papers for 2018, 2021, and 2022 schemes across CSE, ISE, ECE, EEE, Mechanical, and Civil Engineering.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                  <Link href="/vtu/notes" className="text-brand-600 hover:underline">
                    Subject Notes →
                  </Link>
                  <span className="text-ink-300">·</span>
                  <Link href="/vtu/question-papers" className="text-brand-600 hover:underline">
                    Question Papers →
                  </Link>
                  <span className="text-ink-300">·</span>
                  <Link href="/vtu/syllabus" className="text-brand-600 hover:underline">
                    Syllabus PDFs →
                  </Link>
                </div>
              </div>

              <div className="rounded-xl border border-line bg-white p-6 shadow-sm">
                <h3 className="text-base font-bold text-ink-900">
                  2. Curated DSA &amp; Coding Sheets
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-ink-600">
                  Solve industry-standard coding problem sheets including Striver A2Z DSA, NeetCode 150, and Love Babbar 450. Track your solved questions, topic mastery, and algorithmic problem-solving patterns.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                  <Link href="/placements/dsa-sheets" className="text-brand-600 hover:underline">
                    Browse DSA Sheets →
                  </Link>
                  <span className="text-ink-300">·</span>
                  <Link href="/placements/dsa-patterns" className="text-brand-600 hover:underline">
                    DSA Patterns →
                  </Link>
                </div>
              </div>

              <div className="rounded-xl border border-line bg-white p-6 shadow-sm">
                <h3 className="text-base font-bold text-ink-900">
                  3. Placements, Core CS &amp; Job Board
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-ink-600">
                  Master Computer Science core fundamentals—DBMS, Operating Systems, Computer Networks, and SQL queries. Explore curated career roadmaps and verified fresher job and internship listings.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                  <Link href="/placements" className="text-brand-600 hover:underline">
                    Placement Guides →
                  </Link>
                  <span className="text-ink-300">·</span>
                  <Link href="/placements/roadmaps" className="text-brand-600 hover:underline">
                    Roadmaps →
                  </Link>
                  <span className="text-ink-300">·</span>
                  <Link href="/jobs" className="text-brand-600 hover:underline">
                    Fresher Jobs →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
