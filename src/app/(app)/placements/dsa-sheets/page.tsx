import type { Metadata } from "next";
import { PageHeader } from "@/components/layout";
import { DSASheetCard } from "@/components/cards";
import { getDsaProgress, getDsaProblems, getDsaSheets } from "@/lib/queries";
import { getSessionUser } from "@/lib/auth";
import { BreadcrumbsJsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl } from "@/lib/site-config";
import { SheetFilters } from "./SheetFilters";

export const metadata: Metadata = {
  title: "Curated DSA Sheets for Coding Interviews – Striver, NeetCode & Babbar",
  description:
    "Master Data Structures and Algorithms with verified DSA sheets: Striver A2Z DSA Course (455 problems), NeetCode 150, Love Babbar 450, Arsh Goyal, and company interview problem lists.",
  alternates: {
    canonical: absoluteUrl("/placements/dsa-sheets"),
  },
  openGraph: {
    title: "Curated DSA Sheets for Coding Interviews | EngineerPrep India",
    description:
      "Practice topic-wise DSA problems with progress tracking: Striver A2Z, NeetCode 150, Love Babbar 450, and FAANG company coding questions.",
    url: absoluteUrl("/placements/dsa-sheets"),
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Curated DSA Sheets for Coding Interviews | EngineerPrep India",
    description:
      "Practice topic-wise DSA problems with progress tracking: Striver A2Z, NeetCode 150, Love Babbar 450, and FAANG company coding questions.",
  },
};

export default async function DsaSheetsPage({
  searchParams,
}: {
  searchParams: Promise<{ difficulty?: string }>;
}) {
  const { difficulty } = await searchParams;
  const user = await getSessionUser();
  const [sheets, problems, progress] = await Promise.all([
    getDsaSheets(),
    getDsaProblems(),
    user ? getDsaProgress(user.id) : Promise.resolve(new Map()),
  ]);

  const solvedBySheet = new Map<string, number>();
  for (const problem of problems) {
    if (!problem.sheetId || !progress.has(problem.id)) continue;
    solvedBySheet.set(
      problem.sheetId,
      (solvedBySheet.get(problem.sheetId) ?? 0) + 1,
    );
  }

  const filter = (difficulty ?? "ALL").toUpperCase();
  const visible = sheets.filter((sheet) => {
    if (filter === "ALL") return true;
    const s = sheet.difficulty.toUpperCase();
    if (filter === "BEGINNER") return s === "EASY" || s === "BEGINNER";
    if (filter === "INTERMEDIATE") return s === "MEDIUM" || s === "INTERMEDIATE";
    if (filter === "ADVANCED") return s === "HARD" || s === "ADVANCED";
    return true;
  });

  return (
    <>
      <BreadcrumbsJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Placement Guides", url: "/placements" },
          { name: "DSA Sheets", url: "/placements/dsa-sheets" },
        ]}
      />
      <PageHeader
        breadcrumb={[
          { label: "Placement Guides", href: "/placements" },
          { label: "DSA Sheets" },
        ]}
        title="DSA Sheets"
        subtitle="Curated problem sheets from top educators to help you master DSA."
        actions={
          <SheetFilters
            options={[
              { id: "ALL", label: "All Sheets" },
              { id: "BEGINNER", label: "Beginner" },
              { id: "INTERMEDIATE", label: "Intermediate" },
              { id: "ADVANCED", label: "Advanced" },
            ]}
            active={filter}
          />
        }
      />

      {visible.length === 0 ? (
        <div className="epi-card p-10 text-center text-sm text-ink-500">
          No sheets match this difficulty.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((sheet, index) => (
            <DSASheetCard
              key={sheet.id}
              sheet={sheet}
              index={index}
              solved={solvedBySheet.get(sheet.id) ?? 0}
              href={`/placements/dsa-sheets/${sheet.slug}`}
            />
          ))}
        </div>
      )}

      <div className="mt-5 rounded-card border border-line bg-white p-4">
        <p className="text-xs text-ink-500">
          Progress is tracked per problem. Open any sheet to mark problems as
          solved — your completion percentage updates automatically and resumes
          after a refresh.
        </p>
      </div>
    </>
  );
}

