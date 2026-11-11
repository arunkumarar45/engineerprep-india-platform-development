"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookMarked,
  CheckCircle2,
  ChevronLeft,
  FileText,
  FileUp,
  Inbox,
  Loader2,
  NotebookPen,
  ScrollText,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { Badge, Button, Card, Select, useToast } from "@/components/ui";

type Meta = {
  branches: { id: string; code: string; name: string }[];
  semesters: { id: string; number: number; label: string }[];
  schemes: { id: string; name: string }[];
  subjects: {
    id: string;
    name: string;
    code: string;
    branchId: string | null;
    semesterId: string | null;
  }[];
};

export function VtuUploadPageClient({ meta }: { meta: Meta }) {
  const router = useRouter();
  const { push } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [resourceType, setResourceType] = useState<
    "NOTES" | "QUESTION_PAPER" | "SYLLABUS" | "LAB_MANUAL" | "ASSIGNMENT"
  >("NOTES");
  const [branchId, setBranchId] = useState("");
  const [semesterId, setSemesterId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [moduleNumber, setModuleNumber] = useState("");
  const [scheme, setScheme] = useState("2022 Scheme");
  const [year, setYear] = useState("2024");
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);

  const filteredSubjects = meta.subjects.filter((s) => {
    if (branchId && s.branchId !== branchId) return false;
    if (semesterId && s.semesterId !== semesterId) return false;
    return true;
  });

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) acceptFile(dropped);
  }

  function acceptFile(f: File) {
    if (!f.type.includes("pdf") && !f.name.endsWith(".pdf")) {
      push({
        title: "Only PDF files are supported",
        description: "Please upload your notes or question papers in PDF format.",
        tone: "error",
      });
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      push({
        title: "File too large",
        description: "Maximum supported file size is 50 MB.",
        tone: "error",
      });
      return;
    }
    setFile(f);
    if (!title) {
      setTitle(f.name.replace(/\.pdf$/i, "").replace(/[-_]/g, " "));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      push({ title: "Please select a PDF document to upload", tone: "error" });
      return;
    }
    if (!title.trim()) {
      push({ title: "Title is required", tone: "error" });
      return;
    }

    setUploading(true);
    try {
      // Step 1: Upload the physical PDF file
      const form = new FormData();
      form.append("file", file);
      form.append(
        "category",
        (resourceType || "notes").toLowerCase().replace("_", "-"),
      );

      const uploadRes = await fetch("/api/v1/uploads", {
        method: "POST",
        body: form,
      });
      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadJson.message ?? "File upload failed");
      }

      const { publicUrl } = uploadJson.data;
      const fileSizeStr =
        file.size > 1024 * 1024
          ? `${(file.size / 1024 / 1024).toFixed(1)} MB`
          : `${(file.size / 1024).toFixed(0)} KB`;

      // Step 2: Create the database record
      const descDetails = [
        description.trim(),
        scheme ? `Scheme: ${scheme}` : "",
        year ? `Year: ${year}` : "",
      ]
        .filter(Boolean)
        .join(" | ");

      const resourceRes = await fetch("/api/v1/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: descDetails || undefined,
          resourceType,
          subjectId: subjectId || undefined,
          moduleNumber: moduleNumber ? parseInt(moduleNumber, 10) : undefined,
          fileName: file.name,
          fileUrl: publicUrl,
          fileSize: fileSizeStr,
          status: "PUBLISHED",
        }),
      });

      const resourceJson = await resourceRes.json();
      if (!resourceRes.ok) {
        throw new Error(resourceJson.message ?? "Resource creation failed");
      }

      setDone(true);
      push({
        title: "Study Material Published!",
        description: `"${title}" is now available in the VTU Resource Library.`,
        tone: "success",
      });
    } catch (err) {
      push({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Network error",
        tone: "error",
      });
    } finally {
      setUploading(false);
    }
  }

  if (done) {
    const targetPath =
      resourceType === "NOTES"
        ? "/vtu/notes"
        : resourceType === "QUESTION_PAPER"
        ? "/vtu/question-papers"
        : resourceType === "SYLLABUS"
        ? "/vtu/syllabus"
        : resourceType === "LAB_MANUAL"
        ? "/vtu/lab-manuals"
        : "/vtu/resources";

    return (
      <div className="mx-auto max-w-2xl py-12">
        <Card className="flex flex-col items-center gap-4 p-8 text-center shadow-lg border-success-200 bg-success-50/20">
          <CheckCircle2 className="size-16 text-success-600" />
          <h1 className="text-2xl font-bold text-ink-900">Resource Published Live!</h1>
          <p className="max-w-md text-sm text-ink-600">
            Thank you for contributing! Your study material <strong>"{title}"</strong> has been indexed and is immediately downloadable by all students.
          </p>
          <div className="flex flex-wrap gap-3 pt-4">
            <Button onClick={() => router.push(targetPath)}>
              View in Library →
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setDone(false);
                setFile(null);
                setTitle("");
                setDescription("");
              }}
            >
              Upload Another File
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* File Dropzone */}
          <div>
            <label className="mb-2 block text-xs font-bold text-ink-800">
              PDF Document <span className="text-red-500">*</span>
            </label>
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-line bg-surface-50 p-8 text-center transition hover:border-brand-400 hover:bg-brand-50/20"
            >
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) acceptFile(f);
                }}
              />
              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="grid size-12 place-items-center rounded-xl bg-brand-100 text-brand-600">
                    <FileText className="size-6" />
                  </div>
                  <p className="text-sm font-bold text-ink-900">{file.name}</p>
                  <p className="text-xs text-ink-500">
                    {(file.size / 1024 / 1024).toFixed(1)} MB • Click to replace file
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="grid size-12 place-items-center rounded-xl bg-surface-100 text-ink-500">
                    <FileUp className="size-6" />
                  </div>
                  <p className="text-sm font-bold text-ink-800">
                    Click to browse or drag & drop your PDF file here
                  </p>
                  <p className="text-xs text-ink-400">
                    Supports VTU Notes, Solved Question Papers, Model Papers (up to 50 MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Resource Type & Title */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink-800">
                Resource Category <span className="text-red-500">*</span>
              </label>
              <Select
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value as any)}
                className="w-full text-sm"
              >
                <option value="NOTES">Subject Notes (Handwritten / Typed)</option>
                <option value="QUESTION_PAPER">Question Paper / Solved Paper</option>
                <option value="SYLLABUS">Syllabus Copy</option>
                <option value="LAB_MANUAL">Lab Manual / Programs</option>
                <option value="ASSIGNMENT">Assignment / Formula Sheet</option>
              </Select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink-800">
                Title / Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Operating Systems Module 1 Notes (21CS44)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Branch, Semester, Scheme */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink-800">
                Branch / Department
              </label>
              <Select
                value={branchId}
                onChange={(e) => {
                  setBranchId(e.target.value);
                  setSubjectId("");
                }}
                className="w-full text-sm"
              >
                <option value="">All Branches / Common</option>
                {meta.branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.code} — {b.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink-800">
                Semester
              </label>
              <Select
                value={semesterId}
                onChange={(e) => {
                  setSemesterId(e.target.value);
                  setSubjectId("");
                }}
                className="w-full text-sm"
              >
                <option value="">All Semesters</option>
                {meta.semesters.map((s) => (
                  <option key={s.id} value={s.id}>
                    Semester {s.number} ({s.label})
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink-800">
                Scheme
              </label>
              <Select
                value={scheme}
                onChange={(e) => setScheme(e.target.value)}
                className="w-full text-sm"
              >
                <option value="2022 Scheme">2022 Scheme</option>
                <option value="2021 Scheme">2021 Scheme</option>
                <option value="2018 Scheme">2018 Scheme</option>
                <option value="2015 Scheme">2015 Scheme</option>
              </Select>
            </div>
          </div>

          {/* Subject & Module */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink-800">
                Associated Subject (Optional)
              </label>
              <Select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full text-sm"
              >
                <option value="">Select subject (or leave blank)</option>
                {filteredSubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} — {s.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink-800">
                Module Number (For notes)
              </label>
              <Select
                value={moduleNumber}
                onChange={(e) => setModuleNumber(e.target.value)}
                className="w-full text-sm"
              >
                <option value="">Complete Subject / Not Applicable</option>
                <option value="1">Module 1</option>
                <option value="2">Module 2</option>
                <option value="3">Module 3</option>
                <option value="4">Module 4</option>
                <option value="5">Module 5</option>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-ink-800">
              Brief Description / Important Topics Covered
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Handwritten notes covering Process Scheduling, Deadlocks, Semaphore algorithms with solved VTU exam problems..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-line bg-surface p-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-line">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Uploading PDF...
                </>
              ) : (
                <>
                  <Upload className="size-4" /> Upload & Publish Resource
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* Info card */}
      <div className="space-y-4">
        <Card className="p-5 border-brand-200 bg-brand-50/20">
          <h3 className="flex items-center gap-2 text-sm font-bold text-brand-900">
            <Sparkles className="size-4 text-brand-600" /> VTU Student Library
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-ink-600">
            Every semester, thousands of VTU students prepare using community-shared notes and solved papers. Your contributions make high-quality study materials freely accessible to everyone.
          </p>
          <div className="mt-4 space-y-2 text-xs text-ink-700">
            <div className="flex items-center gap-2">
              <span className="text-success-600 font-bold">✓</span> Free PDF storage & fast downloads
            </div>
            <div className="flex items-center gap-2">
              <span className="text-success-600 font-bold">✓</span> Categorized by 2018, 2021 & 2022 Schemes
            </div>
            <div className="flex items-center gap-2">
              <span className="text-success-600 font-bold">✓</span> Module-wise indexing for quick revision
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-bold text-ink-900">Upload Guidelines</h3>
          <ul className="mt-3 space-y-2 text-xs text-ink-600">
            <li>• Ensure scanned handwriting is clear and legible.</li>
            <li>• Include subject code (e.g. 21CS44) in the title for better search.</li>
            <li>• Only PDF format is accepted (max 50 MB).</li>
            <li>• Solved model question papers and previous VTU exam papers are highly appreciated.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

