"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Printer,
  Download,
  Copy,
  Check,
  ArrowLeft,
  FileText,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  BookOpen,
  Share2,
} from "lucide-react";
import { Badge, Button } from "@/components/ui";

interface DocumentData {
  id: string;
  title: string;
  description: string | null;
  resourceType: string;
  moduleNumber: number | null;
  fileName: string;
  fileUrl: string;
  fileSize: string;
  downloadCount: number;
  subjectCode: string | null;
  subjectName: string | null;
  credits: number | null;
  semesterNumber: number | null;
  semesterLabel: string | null;
  branchCode: string | null;
  branchName: string | null;
  schemeName: string | null;
}

export function VtuDocumentViewer({
  doc,
  relatedDocs,
}: {
  doc: DocumentData;
  relatedDocs: Array<{
    id: string;
    title: string;
    resourceType: string;
    moduleNumber: number | null;
  }>;
}) {
  const [copied, setCopied] = useState(false);

  // Strictly eliminate recursive self-view embedding
  const isSelfViewUrl = Boolean(
    doc.fileUrl &&
      (doc.fileUrl.startsWith("/vtu/view") ||
        doc.fileUrl.trim() === "" ||
        doc.fileUrl === "#")
  );

  const isGoogleDrive = Boolean(
    doc.fileUrl && !isSelfViewUrl && doc.fileUrl.includes("drive.google.com")
  );

  // Local PDF check: local static PDF file
  const isLocalPdf = Boolean(
    doc.fileUrl &&
      !isSelfViewUrl &&
      (doc.fileUrl.startsWith("/vtu-official-") ||
        doc.fileUrl.startsWith("/vtu-notes/") ||
        (doc.fileUrl.startsWith("/") && doc.fileUrl.endsWith(".pdf")) ||
        (doc.fileUrl.startsWith("http") && doc.fileUrl.endsWith(".pdf")))
  );

  const hasEmbeddableDocument = !isSelfViewUrl && (isLocalPdf || isGoogleDrive);

  // Google Drive file ID extraction for direct download
  const driveMatch = isGoogleDrive ? doc.fileUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) : null;
  const driveId = driveMatch ? driveMatch[1] : null;

  const directViewUrl = isGoogleDrive
    ? doc.fileUrl.replace(/\/preview$/, "/view")
    : doc.fileUrl;

  const directDownloadUrl = driveId
    ? `https://drive.google.com/uc?export=download&id=${driveId}`
    : doc.fileUrl;

  const sectionHref =
    doc.resourceType === "QUESTION_PAPER"
      ? "/vtu/question-papers"
      : doc.resourceType === "ASSIGNMENT"
      ? "/vtu/assignments"
      : doc.resourceType === "NOTES"
      ? "/vtu/notes"
      : doc.resourceType === "SYLLABUS"
      ? "/vtu/syllabus"
      : "/vtu/resources";

  const typeLabel =
    doc.resourceType === "QUESTION_PAPER"
      ? "Question Paper"
      : doc.resourceType === "ASSIGNMENT"
      ? "Assignment"
      : doc.resourceType === "NOTES"
      ? "Notes"
      : doc.resourceType === "SYLLABUS"
      ? "Syllabus"
      : "Resource";

  function handlePrint() {
    window.print();
  }

  function handleCopy() {
    const textToCopy = `${doc.title}\nCourse: ${doc.subjectCode ?? ""} - ${doc.subjectName ?? ""}\nScheme: ${doc.schemeName ?? "2022"} Scheme | Semester ${doc.semesterNumber ?? "All"}\nLink: ${window.location.href}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function handleDownload() {
    if (isLocalPdf) {
      const a = document.createElement("a");
      a.href = doc.fileUrl;
      a.download = doc.fileName || `${doc.subjectCode ?? "VTU"}-Document.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }
    if (isGoogleDrive) {
      window.open(directDownloadUrl, "_blank");
      return;
    }
    if (doc.fileUrl) {
      window.open(doc.fileUrl, "_blank");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
      {/* Top Header & Navigation Bar */}
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={sectionHref}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-600 transition-colors hover:text-brand-600"
          >
            <ArrowLeft className="size-4" /> Back to VTU {typeLabel}
          </Link>
          <span className="text-ink-300">/</span>
          <span className="inline-flex items-center rounded-md bg-surface px-2 py-0.5 text-[11px] font-bold text-ink-700">
            {doc.subjectCode ?? "VTU"}
          </span>
          <span className="hidden text-xs text-ink-500 sm:inline truncate max-w-xs">
            {doc.subjectName}
          </span>
        </div>

        {/* Global Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {hasEmbeddableDocument && (
            <a
              href={directViewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-brand-300 bg-brand-50/70 px-3 text-xs font-semibold text-brand-700 shadow-sm transition hover:bg-brand-100"
            >
              <ExternalLink className="size-3.5" /> Fullscreen / New Tab
            </a>
          )}

          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? <Check className="size-3.5 text-emerald-600" /> : <Share2 className="size-3.5" />}
            {copied ? "Copied Link" : "Share"}
          </Button>

          {hasEmbeddableDocument && (
            <Button size="sm" onClick={handleDownload} className="bg-brand-500 hover:bg-brand-600 text-white">
              <Download className="size-3.5" /> Download ({doc.fileSize})
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={handlePrint} className="hidden sm:inline-flex">
            <Printer className="size-3.5" /> Print
          </Button>
        </div>
      </div>

      {/* Main Document Details & Embed */}
      <div className="space-y-6">
        {/* Document Header Card */}
        <div className="rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="brand" className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider">
                  {typeLabel}
                </Badge>
                <span className="rounded-md bg-surface px-2 py-0.5 text-xs font-semibold text-ink-600">
                  {doc.schemeName ?? "2022"} Scheme
                </span>
                {doc.semesterNumber && (
                  <span className="rounded-md bg-surface px-2 py-0.5 text-xs font-semibold text-ink-600">
                    Semester {doc.semesterNumber}
                  </span>
                )}
                {doc.branchCode && (
                  <span className="rounded-md bg-surface px-2 py-0.5 text-xs font-semibold text-ink-600">
                    Branch: {doc.branchCode}
                  </span>
                )}
              </div>

              <h1 className="mt-2 text-lg font-black text-ink-900 sm:text-2xl">
                {doc.title}
              </h1>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-600">
                {doc.subjectCode && (
                  <span className="font-semibold">
                    Course Code: <strong className="text-ink-900">{doc.subjectCode}</strong>
                  </span>
                )}
                {doc.subjectName && (
                  <span>
                    Course: <strong className="text-ink-900">{doc.subjectName}</strong>
                  </span>
                )}
                {doc.credits && (
                  <span>
                    Credits: <strong className="text-ink-900">{doc.credits}</strong>
                  </span>
                )}
                <span>
                  Downloads: <strong className="text-ink-900">{doc.downloadCount.toLocaleString()}</strong>
                </span>
              </div>
            </div>

            <div className="hidden sm:flex flex-col items-end text-right">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                <ShieldCheck className="size-3.5" /> Official VTU Resource
              </span>
              <span className="text-xs text-ink-500">
                Visvesvaraya Technological University
              </span>
            </div>
          </div>
        </div>

        {/* PRIMARY HERO: Embedded PDF Viewer */}
        {hasEmbeddableDocument ? (
          <div className="no-print overflow-hidden rounded-2xl border-2 border-line bg-ink-950 shadow-lg">
            {/* Embedded Viewer Controls */}
            <div className="flex items-center justify-between border-b border-white/10 bg-ink-900 px-4 py-2.5 text-white">
              <div className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded bg-brand-500 text-[10px] font-bold text-white">
                  PDF
                </span>
                <span className="truncate text-xs font-semibold text-ink-100 max-w-[260px] sm:max-w-md">
                  {doc.fileName || `${doc.subjectCode ?? "VTU"}-Document.pdf`}
                </span>
                <span className="hidden text-[11px] text-ink-400 sm:inline">({doc.fileSize})</span>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={directViewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-white/20"
                >
                  <ExternalLink className="size-3.5" /> Fullscreen / New Tab
                </a>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-brand-600"
                >
                  <Download className="size-3.5" /> Download
                </button>
              </div>
            </div>

            {/* Google Drive Fallback Notice (if third-party cookies are blocked by browser) */}
            {isGoogleDrive && (
              <div className="flex items-center justify-between border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs text-amber-200">
                <span className="flex items-center gap-1.5">
                  <AlertCircle className="size-4 shrink-0 text-amber-400" />
                  If preview does not load due to browser cookie protection, open or download directly:
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href={directViewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold underline hover:text-white"
                  >
                    Open in Drive ↗
                  </a>
                  <span>·</span>
                  <a
                    href={directDownloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold underline hover:text-white"
                  >
                    Direct Download ↓
                  </a>
                </div>
              </div>
            )}

            {/* Direct In-Browser Document Viewer */}
            <div className="relative h-[82vh] min-h-[680px] w-full bg-white">
              {isGoogleDrive ? (
                <iframe
                  src={
                    doc.fileUrl.includes("/preview")
                      ? doc.fileUrl
                      : `${doc.fileUrl.replace(/\/(view|edit).*$/, "")}/preview`
                  }
                  className="h-full w-full border-none bg-white"
                  allow="autoplay"
                  title={`${doc.title} - Official VTU Document`}
                />
              ) : (
                <iframe
                  src={`${doc.fileUrl}#toolbar=1&navpanes=1`}
                  className="h-full w-full border-none bg-white"
                  title={`${doc.title} - Official VTU Document`}
                />
              )}
            </div>
          </div>
        ) : (
          /* Clean Notice when File is Being Archived */
          <div className="rounded-2xl border border-dashed border-line bg-white p-8 text-center">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <BookOpen className="size-6" />
            </div>
            <h3 className="text-base font-bold text-ink-900">
              Official Curriculum Document
            </h3>
            <p className="mx-auto mt-2 max-w-lg text-xs leading-relaxed text-ink-600">
              {doc.description ||
                "This study material is being synchronized from the official Visvesvaraya Technological University (VTU) academic repositories."}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <Link
                href={`/vtu/syllabus`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink-700 transition hover:border-brand-300 hover:text-brand-600"
              >
                <FileText className="size-3.5" /> View Prescribed Syllabus
              </Link>
              <Link
                href={sectionHref}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-600"
              >
                Browse All VTU {typeLabel}
              </Link>
            </div>
          </div>
        )}

        {/* Academic Course Specifications Overview */}
        <div className="rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6">
          <div className="border-b border-line pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-ink-900">
              Course Details & Examination Scheme
            </h2>
            <p className="text-xs text-ink-500">
              Prescribed under Visvesvaraya Technological University (VTU) Choice Based Credit System (CBCS).
            </p>
          </div>

          {/* 4-Column Attribute Grid */}
          <div className="mt-4 grid grid-cols-2 divide-x divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface/40 text-xs sm:grid-cols-4 sm:divide-y-0">
            <div className="p-3.5">
              <span className="block font-semibold uppercase tracking-wider text-ink-500">Course Code</span>
              <span className="mt-0.5 block font-mono text-sm font-bold text-ink-900">
                {doc.subjectCode ?? "N/A"}
              </span>
            </div>
            <div className="p-3.5">
              <span className="block font-semibold uppercase tracking-wider text-ink-500">Credits</span>
              <span className="mt-0.5 block text-sm font-bold text-ink-900">
                {doc.credits ? `${doc.credits} Credits` : "3-4 Credits"}
              </span>
            </div>
            <div className="p-3.5">
              <span className="block font-semibold uppercase tracking-wider text-ink-500">Semester & Branch</span>
              <span className="mt-0.5 block text-sm font-bold text-ink-900">
                Sem {doc.semesterNumber ?? "All"} · {doc.branchCode ?? "All Branches"}
              </span>
            </div>
            <div className="p-3.5">
              <span className="block font-semibold uppercase tracking-wider text-ink-500">Exam Scheme</span>
              <span className="mt-0.5 block text-sm font-bold text-ink-900">
                CIE: 50 · SEE: 50 (3 Hrs)
              </span>
            </div>
          </div>

          {/* Description */}
          {doc.description && (
            <div className="mt-4 rounded-xl border border-line bg-surface/30 p-4 text-xs leading-relaxed text-ink-700">
              <strong className="block font-semibold text-ink-900">Document Overview:</strong>
              <p className="mt-1 whitespace-pre-line">{doc.description}</p>
            </div>
          )}
        </div>

        {/* Related Materials for the Same Subject */}
        {relatedDocs.length > 0 && (
          <div className="no-print rounded-2xl border border-line bg-white p-6">
            <div className="border-b border-line pb-3">
              <h3 className="text-base font-bold text-ink-900">
                All Verified Study Materials for {doc.subjectCode ?? ""} {doc.subjectName ? `(${doc.subjectName})` : ""}
              </h3>
              <p className="mt-0.5 text-xs text-ink-500">
                Quickly access syllabus, lecture notes, and question papers for this course.
              </p>
            </div>

            <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {relatedDocs.map((item) => (
                <Link
                  key={item.id}
                  href={`/vtu/view/${item.id}`}
                  className={`flex items-center gap-2.5 rounded-xl border p-3 text-xs transition-colors ${
                    item.id === doc.id
                      ? "border-brand-500 bg-brand-50/60 font-bold text-brand-700 shadow-xs"
                      : "border-line bg-surface/50 text-ink-800 hover:border-brand-300 hover:text-brand-600 hover:bg-white"
                  }`}
                >
                  <FileText className="size-4 shrink-0 text-brand-500" />
                  <span className="truncate">{item.title}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
