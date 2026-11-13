import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Code2, GraduationCap, Heart, Mail, Shield, Users } from "lucide-react";
import { PageHeader } from "@/components/layout";
import { Card, Badge } from "@/components/ui";
import { absoluteUrl } from "@/lib/site-config";
import { BreadcrumbsJsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "About Us | EngineerPrep India",
  description:
    "Learn about EngineerPrep India's mission to provide open, high-quality VTU academic resources and comprehensive placement preparation for engineering students.",
  alternates: {
    canonical: absoluteUrl("/about"),
  },
  openGraph: {
    title: "About Us | EngineerPrep India",
    description:
      "Our mission: empowering engineering students with authentic VTU notes, question papers, curated DSA sheets, and placement roadmaps.",
    url: absoluteUrl("/about"),
  },
};

export default function AboutPage() {
  return (
    <>
      <BreadcrumbsJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "About Us", url: "/about" },
        ]}
      />
      <PageHeader
        breadcrumb={[{ label: "About Us" }]}
        title="About EngineerPrep India"
        subtitle="Empowering engineering students with authentic curriculum materials, structured DSA preparation, and direct placement opportunities."
      />

      <div className="space-y-8 max-w-4xl">
        <Card className="p-6 sm:p-8">
          <Badge tone="brand" className="mb-3">
            Our Mission
          </Badge>
          <h2 className="text-xl font-extrabold text-ink-900 tracking-tight sm:text-2xl">
            Bridging the Gap Between University Exams and Tech Industry Careers
          </h2>
          <p className="mt-3 text-sm text-ink-600 leading-relaxed">
            Engineering students in India often face a dual challenge: preparing for demanding university semester examinations while simultaneously building competitive algorithmic problem-solving and system design skills for campus placements.
          </p>
          <p className="mt-3 text-sm text-ink-600 leading-relaxed">
            EngineerPrep India was founded to solve this dilemma by organizing verified, scheme-specific Visvesvaraya Technological University (VTU) academic materials alongside battle-tested Data Structures &amp; Algorithms (DSA) sheets curated by top Indian educators—all within a single, distraction-free environment.
          </p>
        </Card>

        <div className="grid gap-5 sm:grid-cols-3">
          <Card className="p-5">
            <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-500 mb-3">
              <BookOpen className="size-5" />
            </span>
            <h3 className="text-base font-bold text-ink-900">Authentic VTU Archive</h3>
            <p className="mt-1.5 text-xs text-ink-500 leading-relaxed">
              Official scheme syllabi, module-wise notes, previous year question papers, and lab manuals verified against university curriculum guidelines.
            </p>
          </Card>

          <Card className="p-5">
            <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-500 mb-3">
              <Code2 className="size-5" />
            </span>
            <h3 className="text-base font-bold text-ink-900">Curated DSA Practice</h3>
            <p className="mt-1.5 text-xs text-ink-500 leading-relaxed">
              Striver, Love Babbar, NeetCode, Rohit Negi, and Apna College problem sheets with persistent progress tracking and solution references.
            </p>
          </Card>

          <Card className="p-5">
            <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-500 mb-3">
              <GraduationCap className="size-5" />
            </span>
            <h3 className="text-base font-bold text-ink-900">Placement Roadmaps</h3>
            <p className="mt-1.5 text-xs text-ink-500 leading-relaxed">
              Role-oriented developer career paths, mock assessment tests, core CS subjects (OS, DBMS, Networks), and verified job openings.
            </p>
          </Card>
        </div>

        <Card className="p-6 sm:p-8 bg-surface-elevated border-line">
          <h2 className="text-lg font-bold text-ink-900">Educational Integrity &amp; Open Access</h2>
          <p className="mt-2 text-xs text-ink-600 leading-relaxed">
            All curriculum documents and university resources indexed on EngineerPrep India are provided for non-commercial educational study purposes. We respect intellectual property and attribution: educator sheets attribute their respective creators, and university documents cite official notifications.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/vtu"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-500 px-4 text-xs font-bold text-white hover:bg-brand-600"
            >
              Explore VTU Library <ArrowRight className="size-3.5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-4 text-xs font-semibold text-ink-700 hover:border-brand-400 hover:text-brand-600"
            >
              Get in Touch
            </Link>
          </div>
        </Card>
      </div>
    </>
  );
}

