import type { Metadata } from "next";
import { PageHeader } from "@/components/layout";
import { Card } from "@/components/ui";
import { absoluteUrl } from "@/lib/site-config";
import { BreadcrumbsJsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Terms of Service | EngineerPrep India",
  description:
    "Review the terms of service governing usage of EngineerPrep India's platform, educational materials, and student career resources.",
  alternates: {
    canonical: absoluteUrl("/terms"),
  },
  openGraph: {
    title: "Terms of Service | EngineerPrep India",
    description: "Guidelines, terms of use, and educational fair-use principles for EngineerPrep India.",
    url: absoluteUrl("/terms"),
  },
};

export default function TermsPage() {
  return (
    <>
      <BreadcrumbsJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Terms of Service", url: "/terms" },
        ]}
      />
      <PageHeader
        breadcrumb={[{ label: "Terms of Service" }]}
        title="Terms of Service"
        subtitle="Last revised: November 2026. Standard terms governing the use of EngineerPrep India."
      />

      <Card className="max-w-4xl p-6 sm:p-8 space-y-6 text-sm text-ink-700 leading-relaxed">
        <section>
          <h2 className="text-base font-bold text-ink-900 mb-2">1. Educational Purpose &amp; Non-Commercial Use</h2>
          <p>
            EngineerPrep India is provided as an open educational resource hub. Study materials, VTU syllabus documents, previous year question papers, and educator problem lists are indexed strictly for non-commercial individual learning, academic study, and technical interview preparation.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-ink-900 mb-2">2. Intellectual Property &amp; Attribution</h2>
          <p>
            Curriculum documents and question papers are the academic property of their respective examining bodies (such as Visvesvaraya Technological University). Curated DSA sheets and video lectures are attributed to their respective educator creators. EngineerPrep India acts as an indexing, organizing, and progress-tracking companion for students.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-ink-900 mb-2">3. User Conduct &amp; Account Responsibility</h2>
          <p>
            Users agree not to attempt unauthorized penetration testing, denial-of-service disruptions, automated scraping of protected student records, or modification of other users&apos; learning progress data. Each user is responsible for safeguarding their login credentials.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-ink-900 mb-2">4. Job Application Disclaimer</h2>
          <p>
            EngineerPrep India indexes publicly available engineering job and internship listings. We do not act as an employment agency, guarantee interview callbacks, or charge fees for employment opportunities. Students apply directly to verified corporate career portals.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-ink-900 mb-2">5. Updates to Terms</h2>
          <p>
            We may update these terms periodically to reflect new features or platform policies. Continued use of the platform constitutes acceptance of updated terms.
          </p>
        </section>
      </Card>
    </>
  );
}

