import type { Metadata } from "next";
import { PageHeader } from "@/components/layout";
import { Card } from "@/components/ui";
import { absoluteUrl } from "@/lib/site-config";
import { BreadcrumbsJsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Privacy Policy | EngineerPrep India",
  description:
    "Review EngineerPrep India's privacy policy, detailing how student account data, learning progress, and platform security are handled transparently.",
  alternates: {
    canonical: absoluteUrl("/privacy-policy"),
  },
  openGraph: {
    title: "Privacy Policy | EngineerPrep India",
    description: "Our commitment to student data privacy, security, and transparent academic tracking.",
    url: absoluteUrl("/privacy-policy"),
  },
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <BreadcrumbsJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Privacy Policy", url: "/privacy-policy" },
        ]}
      />
      <PageHeader
        breadcrumb={[{ label: "Privacy Policy" }]}
        title="Privacy Policy"
        subtitle="Last revised: November 2026. Your privacy and academic data rights are paramount."
      />

      <Card className="max-w-4xl p-6 sm:p-8 space-y-6 text-sm text-ink-700 leading-relaxed">
        <section>
          <h2 className="text-base font-bold text-ink-900 mb-2">1. Information We Collect</h2>
          <p>
            When you register on EngineerPrep India, we collect your name, university email address, graduation year, target engineering branch, and authentication credentials. Password data is hashed using industry-standard Argon2id and never stored in plain text.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-ink-900 mb-2">2. How We Use Your Data</h2>
          <p>We use collected data solely to:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-ink-600 text-xs">
            <li>Save your personal problem-solving progress across DSA sheets and developer roadmaps.</li>
            <li>Maintain your personal bookmarks, download history, and mock test assessment attempts.</li>
            <li>Deliver relevant VTU circular updates and engineering job alerts if opted in.</li>
            <li>Maintain session authentication and protect accounts against unauthorized access.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-ink-900 mb-2">3. Zero Data Sale Guarantee</h2>
          <p>
            We strictly do not sell, rent, monetize, or trade student personal information, resume files, or academic progress data to third-party data brokers or marketing networks.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-ink-900 mb-2">4. Cookies and Security</h2>
          <p>
            EngineerPrep India uses secure, HTTP-only cookies strictly for authentication session tokens and CSRF protection. We do not use third-party invasive cross-site tracking cookies.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-ink-900 mb-2">5. Data Retention &amp; Account Rights</h2>
          <p>
            You have the right to inspect, update, or request complete deletion of your account and associated learning progress records at any time through Account Settings or by contacting support@engineerprep.in.
          </p>
        </section>
      </Card>
    </>
  );
}

