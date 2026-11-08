import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Building2,
  Code2,
  FileStack,
  Flame,
  GraduationCap,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { Brandmark } from "@/components/layout/Navbar";
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

const STATS = [
  { value: "20K+", label: "Students", icon: Users },
  { value: "500+", label: "DSA Problems", icon: Code2 },
  { value: "300+", label: "Resources", icon: FileStack },
  { value: "100+", label: "Companies", icon: Building2 },
  { value: "Daily", label: "VTU Updates", icon: Flame },
];

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
      <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 lg:px-6">
          <Brandmark />
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
          <div className="ml-auto flex items-center gap-2">
            {user ? (
              <Link
                href="/dashboard"
                className="hidden rounded-lg bg-brand-500 px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-brand-600 sm:inline-flex"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-ink-700 hover:bg-brand-50 hover:text-brand-600"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="inline-flex h-9 items-center rounded-lg bg-brand-500 px-3.5 text-xs font-bold text-white transition-colors hover:bg-brand-600"
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
                Everything You Need for Your{" "}
                <span className="text-brand-500">Engineering Journey.</span>
              </h1>
              <p className="mt-4 max-w-xl text-[0.95rem] leading-relaxed text-ink-500">
                Study smarter, prepare for placements and discover
                opportunities — all in one platform.
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
              <img
                src="/images/hero-student.png"
                alt="Engineering student preparing with EngineerPrep India"
                width={640}
                height={520}
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
          <div className="mx-auto grid max-w-7xl gap-5 px-4 py-10 sm:grid-cols-3 lg:grid-cols-5 lg:px-6">
            {STATS.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="flex items-center gap-3">
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
                papers and {stats.LAB_MANUAL.toLocaleString()} lab manuals are already indexed.
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
      </main>

      <Footer />
    </div>
  );
}
