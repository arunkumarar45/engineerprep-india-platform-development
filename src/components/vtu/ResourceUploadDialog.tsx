"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  FileText,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Select,
  useToast,
} from "@/components/ui";

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

export function ResourceUploadDialog({
  meta,
  onClose,
  isAdmin = false,
}: {
  meta: Meta;
  onClose: () => void;
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const { push } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [resourceType, setResourceType] = useState("NOTES");
  const [branchId, setBranchId] = useState("");
  const [semesterId, setSemesterId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [moduleNumber, setModuleNumber] = useState("");
  const [year, setYear] = useState("");
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
      push({ title: "Only PDF files are allowed", tone: "error" });
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      push({ title: "File too large (max 50 MB)", tone: "error" });
      return;
    }
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.pdf$/i, "").replace(/[-_]/g, " "));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      push({ title: "Please select a PDF file", tone: "error" });
      return;
    }
    if (!title.trim()) {
      push({ title: "Title is required", tone: "error" });
      return;
    }

    setUploading(true);
    try {
      // Step 1 — upload the file
      const form = new FormData();
      form.append("file", file);
      form.append("category", (resourceType || "notes").toLowerCase().replace("_", "-"));

      const uploadRes = await fetch("/api/v1/uploads", {
        method: "POST",
        body: form,
      });
      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadJson.message ?? "Upload failed");
      }

      const { publicUrl } = uploadJson.data;
      const fileSizeStr =
        file.size > 1024 * 1024
          ? `${(file.size / 1024 / 1024).toFixed(1)} MB`
          : `${(file.size / 1024).toFixed(0)} KB`;

      // Step 2 — create the resource record
      const resourceRes = await fetch("/api/v1/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          resourceType,
          subjectId: subjectId || undefined,
          moduleNumber: moduleNumber ? parseInt(moduleNumber) : undefined,
          fileName: file.name,
          fileUrl: publicUrl,
          fileSize: fileSizeStr,
          status: "PUBLISHED",
          // extra metadata stored in description if year provided
          ...(year ? { description: `${description.trim()} | Year: ${year}`.trim().replace(/^\|/, "") } : {}),
        }),
      });
      const resourceJson = await resourceRes.json();
      if (!resourceRes.ok) {
        throw new Error(resourceJson.message ?? "Resource creation failed");
      }

      setDone(true);
      push({ title: "Resource published!", description: "Your PDF is now live in the library.", tone: "success" });
      setTimeout(() => {
        router.refresh();
        onClose();
      }, 1500);
    } catch (err) {
      push({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Unknown error",
        tone: "error",
      });
    } finally {
      setUploading(false);
    }
  }

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <Card className="flex flex-col items-center gap-3 p-8 text-center">
          <CheckCircle2 className="size-12 text-success-500" />
          <p className="font-bold text-ink-900">Resource published!</p>
          <p className="text-sm text-ink-500">
            The PDF is now live in the resource library for all students.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <Card className="w-full max-w-2xl overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line p-4">
          <div>
            <h2 className="font-bold text-ink-900">Upload VTU Resource</h2>
            <p className="text-xs text-ink-500">
              Upload notes, question papers, or syllabus copies (PDF only)
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid size-8 place-items-center rounded-lg hover:bg-surface-100"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Drop zone */}
          <div
            className={`relative flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer
              ${file ? "border-brand-400 bg-brand-50" : "border-line hover:border-brand-300 hover:bg-surface-50"}`}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,application/pdf"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) acceptFile(f);
              }}
            />
            {file ? (
              <>
                <FileText className="size-10 text-brand-500" />
                <div>
                  <p className="font-semibold text-ink-900">{file.name}</p>
                  <p className="text-xs text-ink-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB · PDF
                  </p>
                </div>
                <Badge tone="success">Ready to upload</Badge>
              </>
            ) : (
              <>
                <Upload className="size-10 text-ink-400" />
                <div>
                  <p className="font-semibold text-ink-900">
                    Drop PDF here or click to browse
                  </p>
                  <p className="text-xs text-ink-500">Max 50 MB · PDF only</p>
                </div>
              </>
            )}
          </div>

          {/* Resource type */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { value: "NOTES", label: "📖 Notes" },
              { value: "QUESTION_PAPER", label: "📝 Question Paper" },
              { value: "SYLLABUS", label: "📋 Syllabus" },
              { value: "ASSIGNMENT", label: "✏️ Assignment" },
              { value: "OTHER", label: "📎 Other" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setResourceType(opt.value)}
                className={`rounded-lg border px-3 py-2 text-left text-xs font-semibold transition-colors
                  ${resourceType === opt.value
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-line text-ink-700 hover:border-brand-300"
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Title */}
          <div>
            <label className="epi-label">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-400 focus:outline-none"
              placeholder="e.g. Data Structures Module 3 Notes"
            />
          </div>

          {/* Description */}
          <div>
            <label className="epi-label">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-400 focus:outline-none"
              placeholder="Brief description of what this resource covers"
            />
          </div>

          {/* Academic filters */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="epi-label">Branch</label>
              <Select
                value={branchId}
                onChange={(e) => {
                  setBranchId(e.target.value);
                  setSubjectId("");
                }}
                className="mt-1 h-9 w-full py-0 text-xs"
              >
                <option value="">All Branches</option>
                {meta.branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.code} — {b.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="epi-label">Semester</label>
              <Select
                value={semesterId}
                onChange={(e) => {
                  setSemesterId(e.target.value);
                  setSubjectId("");
                }}
                className="mt-1 h-9 w-full py-0 text-xs"
              >
                <option value="">All Semesters</option>
                {meta.semesters.map((s) => (
                  <option key={s.id} value={s.id}>
                    Sem {s.number}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="epi-label">Subject</label>
              <Select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="mt-1 h-9 w-full py-0 text-xs"
                disabled={filteredSubjects.length === 0}
              >
                <option value="">Select Subject</option>
                {filteredSubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="epi-label">
                {resourceType === "QUESTION_PAPER" ? "Year" : "Module"}
              </label>
              {resourceType === "QUESTION_PAPER" ? (
                <Select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="mt-1 h-9 w-full py-0 text-xs"
                >
                  <option value="">Select Year</option>
                  {[2024, 2023, 2022, 2021, 2020, 2019].map((y) => (
                    <option key={y} value={String(y)}>
                      {y}
                    </option>
                  ))}
                </Select>
              ) : (
                <Select
                  value={moduleNumber}
                  onChange={(e) => setModuleNumber(e.target.value)}
                  className="mt-1 h-9 w-full py-0 text-xs"
                >
                  <option value="">All Modules</option>
                  {[1, 2, 3, 4, 5].map((m) => (
                    <option key={m} value={String(m)}>
                      Module {m}
                    </option>
                  ))}
                </Select>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 border-t border-line pt-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={uploading || !file}>
              {uploading ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Uploading…
                </>
              ) : (
                <>
                  <Upload className="size-4" /> Upload Resource
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

