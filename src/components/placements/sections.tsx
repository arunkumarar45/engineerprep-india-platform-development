"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Brain,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock,
  Code2,
  Copy,
  Database,
  ExternalLink,
  Flame,
  HelpCircle,
  Layers,
  Lightbulb,
  MessageSquare,
  Percent,
  Play,
  PlayCircle,
  Search,
  Server,
  Sparkles,
  Table2,
  Trophy,
  Video,
  RotateCcw,
} from "lucide-react";
import { Badge, Button, Card, CodeBlock, Modal, ProgressBar, SegmentedControl, useToast } from "@/components/ui";
import { cn } from "@/lib/utils";

import playlistsData from "@/data/playlists-meta.json";
import systemDesignData from "@/data/system-design.json";
import sqlSheetData from "@/data/sql-sheet.json";
import aptitudeData from "@/data/aptitude.json";
import interviewQuestionsData from "@/data/interview-questions.json";
import challengeData from "@/data/placement-challenge.json";

/* --------------------------- DSA Playlists --------------------------- */

export function PlaylistsSection() {
  const [category, setCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedPlaylist, setSelectedPlaylist] = useState<any | null>(null);
  const [activeVideo, setActiveVideo] = useState<any | null>(null);
  const [lectureSearch, setLectureSearch] = useState("");
  const [loadingLectures, setLoadingLectures] = useState(false);

  const filtered = useMemo(() => {
    return playlistsData.filter((p: any) => {
      if (category !== "all" && p.category !== category) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesInstructor = (p.instructor || "").toLowerCase().includes(q);
        const matchesChannel = (p.channel || "").toLowerCase().includes(q);
        if (!matchesTitle && !matchesInstructor && !matchesChannel) return false;
      }
      return true;
    });
  }, [category, search]);

  const selectedLectures = useMemo(() => {
    if (!selectedPlaylist) return [];
    if (Array.isArray(selectedPlaylist.lectures) && selectedPlaylist.lectures.length > 0) {
      return selectedPlaylist.lectures;
    }
    if (Array.isArray(selectedPlaylist.sections)) {
      return selectedPlaylist.sections.flatMap((s: any) =>
        (s.videos || []).map((v: any, vIdx: number) => ({
          ...v,
          index: v.index || vIdx + 1,
          sectionTitle: v.sectionTitle || s.title,
        }))
      );
    }
    return [];
  }, [selectedPlaylist]);

  const filteredLectures = useMemo(() => {
    if (!lectureSearch.trim()) return selectedLectures;
    const q = lectureSearch.toLowerCase();
    return selectedLectures.filter(
      (lec: any) =>
        (lec.title || "").toLowerCase().includes(q) ||
        (lec.sectionTitle || "").toLowerCase().includes(q)
    );
  }, [selectedLectures, lectureSearch]);

  const handleOpenPlaylist = async (playlist: any) => {
    setSelectedPlaylist(playlist);
    setLectureSearch("");

    const hasVideos =
      (Array.isArray(playlist.lectures) && playlist.lectures.length > 0) ||
      (Array.isArray(playlist.sections) && playlist.sections.length > 0);

    if (hasVideos) {
      const lecs =
        Array.isArray(playlist.lectures) && playlist.lectures.length > 0
          ? playlist.lectures
          : Array.isArray(playlist.sections)
          ? playlist.sections.flatMap((s: any) => s.videos || [])
          : [];
      setActiveVideo(lecs[0] || null);
      return;
    }

    setLoadingLectures(true);
    try {
      const res = await fetch(`/api/v1/dsa/playlists/${playlist.slug}`);
      if (res.ok) {
        const json = await res.json();
        const full = json.data?.playlist;
        if (full) {
          setSelectedPlaylist({ ...playlist, ...full });
          const lecs =
            Array.isArray(full.lectures) && full.lectures.length > 0
              ? full.lectures
              : Array.isArray(full.sections)
              ? full.sections.flatMap((s: any) =>
                  (s.videos || []).map((v: any, vIdx: number) => ({
                    ...v,
                    index: v.index || vIdx + 1,
                    sectionTitle: v.sectionTitle || s.title,
                  }))
                )
              : [];
          setActiveVideo(lecs[0] || null);
        }
      }
    } catch (e) {
      console.error("Failed to fetch playlist details", e);
    } finally {
      setLoadingLectures(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Search and Category Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative min-w-0 flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              placeholder="Search playlists by topic, educator, or channel..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-line bg-surface pl-9 pr-3 py-1.5 text-xs text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-ink-400 hover:text-ink-700"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "all", label: "All Playlists" },
              { id: "dsa", label: "DSA" },
              { id: "system-design", label: "System Design" },
              { id: "dbms", label: "DBMS" },
              { id: "os", label: "Operating Systems" },
              { id: "oops", label: "OOPs" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCategory(tab.id)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                  category === tab.id
                    ? "bg-brand-600 text-white shadow-xs"
                    : "border border-line bg-surface text-ink-600 hover:bg-surface-elevated hover:text-ink-900",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Playlists Grid */}
      {filtered.length === 0 ? (
        <Card className="p-10 text-center text-sm text-ink-500">
          No playlists match your search.
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((playlist: any) => {
            const videoCount =
              playlist.totalVideos ||
              (playlist.sections?.reduce(
                (a: number, s: any) => a + (s.videos?.length || 0),
                0
              ) ?? 0) ||
              (playlist.lectures?.length ?? 0);

            const thumbUrl =
              playlist.thumbnailUrl || `/thumbnails/dsa-playlists/${playlist.slug}.jpg`;

            return (
              <Card key={playlist.slug} hover className="group flex h-full flex-col overflow-hidden p-0 border border-line bg-surface transition-all duration-300 hover:shadow-lg">
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-ink-950">
                  <img
                    src={thumbUrl}
                    alt={playlist.thumbnailAlt || `${playlist.title} by ${playlist.instructor || playlist.channel}`}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = "none";
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = "flex";
                    }}
                  />

                  {/* Graceful Fallback if image fails */}
                  <div className="hidden absolute inset-0 flex-col items-center justify-center bg-gradient-to-br from-red-600 to-red-800 text-white p-4 text-center">
                    <Video className="size-8 mb-2 opacity-80" />
                    <p className="text-xs font-bold line-clamp-2">{playlist.title}</p>
                  </div>

                  {/* Top Badges Overlay */}
                  <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2 pointer-events-none">
                    <Badge tone="brand" className="backdrop-blur-md bg-white/95 uppercase text-[0.65rem] font-bold text-brand-700 shadow-xs">
                      {playlist.category}
                    </Badge>
                    <div className="inline-flex items-center gap-1 rounded-md bg-red-600/90 px-2 py-0.5 text-[0.65rem] font-bold text-white shadow-xs backdrop-blur-xs">
                      <Play className="size-2.5 fill-white" />
                      <span>YouTube</span>
                    </div>
                  </div>

                  {/* Bottom Stats Pills */}
                  <div className="absolute inset-x-3 bottom-2.5 flex items-center justify-between gap-2 pointer-events-none">
                    <span className="inline-flex items-center rounded-md bg-ink-950/85 px-2 py-0.5 text-[0.68rem] font-bold text-white shadow-xs backdrop-blur-xs">
                      {videoCount} Lectures
                    </span>
                    <span className="inline-flex items-center rounded-md bg-ink-950/85 px-2 py-0.5 text-[0.68rem] font-bold text-white shadow-xs backdrop-blur-xs">
                      {playlist.totalDuration}
                    </span>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <h3 className="line-clamp-2 text-sm font-bold text-ink-900 group-hover:text-brand-600 transition-colors leading-snug">
                    {playlist.title}
                  </h3>
                  <p className="mt-1 text-xs text-ink-500">
                    by <span className="font-semibold text-ink-700">{playlist.instructor || playlist.channel}</span>
                  </p>

                  <dl className="mt-3.5 grid grid-cols-2 gap-2 text-[0.7rem]">
                    <div className="rounded-lg bg-surface-elevated border border-line px-2.5 py-1.5">
                      <dt className="text-ink-500 font-medium text-[0.65rem]">Lectures</dt>
                      <dd className="font-bold text-ink-900">{videoCount} videos</dd>
                    </div>
                    <div className="rounded-lg bg-surface-elevated border border-line px-2.5 py-1.5">
                      <dt className="text-ink-500 font-medium text-[0.65rem]">Duration</dt>
                      <dd className="font-bold text-ink-900">{playlist.totalDuration}</dd>
                    </div>
                  </dl>

                  <div className="mt-auto pt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => handleOpenPlaylist(playlist)}
                    >
                      <BookOpen className="size-3.5" /> Lectures ({videoCount})
                    </Button>
                    <a
                      href={playlist.playlistUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-red-700 transition"
                    >
                      <span>YouTube</span>
                      <ExternalLink className="size-3.5" />
                    </a>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Interactive Video & Lecture List Modal */}
      {selectedPlaylist && (
        <Modal
          open={Boolean(selectedPlaylist)}
          onClose={() => {
            setSelectedPlaylist(null);
            setActiveVideo(null);
          }}
          title={selectedPlaylist.title}
          footer={
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
              <span className="text-xs text-ink-500">
                {selectedLectures.length} lectures · {selectedPlaylist.totalDuration} · By {selectedPlaylist.instructor || selectedPlaylist.channel}
              </span>
              <div className="flex gap-2">
                <a
                  href={selectedPlaylist.playlistUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-red-700 transition"
                >
                  <span>Open Full Playlist on YouTube</span>
                  <ExternalLink className="size-3.5" />
                </a>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setSelectedPlaylist(null);
                    setActiveVideo(null);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            {loadingLectures ? (
              <div className="py-16 text-center">
                <div className="inline-block size-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                <p className="mt-3 text-xs text-ink-500 font-medium">Loading playlist curriculum & lectures...</p>
              </div>
            ) : (
              <>
                {/* Embedded Active Video Player */}
                {activeVideo && (
                  <div className="space-y-2">
                    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black shadow-md border border-line">
                      <iframe
                        className="size-full"
                        src={`https://www.youtube-nocookie.com/embed/${
                          activeVideo.youtubeId ||
                          activeVideo.videoUrl?.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]+)/)?.[1] ||
                          ""
                        }?autoplay=1&rel=0`}
                        title={activeVideo.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2 p-3 bg-surface-elevated rounded-xl border border-line">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-ink-900 truncate">
                          {activeVideo.title}
                        </p>
                        <p className="text-[0.68rem] text-ink-500">
                          {activeVideo.sectionTitle || selectedPlaylist.title} · {activeVideo.duration || "Video"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {activeVideo.problemUrl && (
                          <a
                            href={activeVideo.problemUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[0.68rem] font-bold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 px-2.5 py-1 rounded-md"
                          >
                            <span>Practice Problem</span>
                            <ExternalLink className="size-2.5" />
                          </a>
                        )}
                        <a
                          href={activeVideo.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[0.68rem] font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1 rounded-md"
                        >
                          <span>Watch on YouTube</span>
                          <ExternalLink className="size-2.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Lecture Filter Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-400" />
                  <input
                    type="text"
                    placeholder="Search lectures in this playlist..."
                    value={lectureSearch}
                    onChange={(e) => setLectureSearch(e.target.value)}
                    className="w-full rounded-lg border border-line bg-surface pl-8 pr-3 py-1.5 text-xs text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none"
                  />
                </div>

                {/* Lectures List */}
                <div className="divide-y divide-line rounded-xl border border-line overflow-hidden bg-surface">
                  {filteredLectures.length === 0 ? (
                    <div className="p-6 text-center text-xs text-ink-500">
                      No lectures match "{lectureSearch}".
                    </div>
                  ) : (
                    filteredLectures.map((lec: any, idx: number) => {
                      const isCurrent =
                        activeVideo &&
                        (activeVideo.id === lec.id || activeVideo.title === lec.title);

                      return (
                        <div
                          key={lec.id || idx}
                          className={cn(
                            "flex items-center justify-between gap-3 py-2.5 px-3 hover:bg-surface-elevated transition",
                            isCurrent && "bg-brand-50/60 border-l-2 border-brand-500"
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <span className="w-6 text-xs font-bold text-ink-400 tabular-nums">
                              #{lec.index || idx + 1}
                            </span>
                            <div className="min-w-0">
                              <p
                                className={cn(
                                  "text-xs font-semibold truncate cursor-pointer hover:text-brand-600 transition",
                                  isCurrent ? "text-brand-600 font-bold" : "text-ink-900"
                                )}
                                onClick={() => setActiveVideo(lec)}
                              >
                                {lec.title}
                              </p>
                              {lec.sectionTitle && (
                                <p className="text-[0.68rem] text-ink-500 truncate">
                                  {lec.sectionTitle}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[0.68rem] text-ink-400 font-medium">
                              {lec.duration || "Video"}
                            </span>
                            <Button
                              size="sm"
                              variant={isCurrent ? "primary" : "outline"}
                              className="h-6 text-[0.68rem] px-2"
                              onClick={() => setActiveVideo(lec)}
                            >
                              <PlayCircle className="size-3" />
                              <span>{isCurrent ? "Playing" : "Watch"}</span>
                            </Button>
                            <a
                              href={lec.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[0.68rem] font-bold text-red-600 hover:bg-red-100 transition"
                              title="Open directly on YouTube"
                            >
                              <span>YouTube</span>
                              <ExternalLink className="size-2.5" />
                            </a>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

/* -------------------------- System Design ---------------------------- */

export function SystemDesignSection() {
  const [mounted, setMounted] = useState(false);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [studiedIds, setStudiedIds] = useState<number[]>([]);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("epi_sys_design_studied");
      if (saved) setStudiedIds(JSON.parse(saved));
    } catch {}
  }, []);

  const questions = systemDesignData.questions || [];

  const filtered = useMemo(() => {
    return questions.filter((q: any) => {
      if (filterType !== "ALL" && q.type !== filterType) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesTitle = q.title.toLowerCase().includes(query);
        const matchesCompany = (q.companies || []).some((c: string) => c.toLowerCase().includes(query));
        if (!matchesTitle && !matchesCompany) return false;
      }
      return true;
    });
  }, [questions, filterType, search]);

  const toggleStudied = (id: number) => {
    setStudiedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem("epi_sys_design_studied", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const studiedCount = mounted ? studiedIds.length : 0;
  const progressPercent = Math.round((studiedCount / Math.max(1, questions.length)) * 100);

  return (
    <div className="space-y-5" suppressHydrationWarning>
      {/* Progress & Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-bold text-ink-900">System Design Preparation Sheet</h2>
              <Badge tone="brand">{studiedCount} / {questions.length} completed</Badge>
            </div>
            <p className="mt-1 text-xs text-ink-500">
              32 High Level Design (HLD) and Low Level Design (LLD) case studies frequently asked in Tier-1 & MAANG interviews.
            </p>
          </div>

          <div className="w-full lg:w-48">
            <ProgressBar value={progressPercent} />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 pt-3 border-t border-line sm:flex-row sm:items-center sm:justify-between">
          <div className="relative min-w-0 flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              placeholder="Search by topic, e.g. Rate Limiter, Twitter, Uber..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-line bg-surface pl-9 pr-3 py-1.5 text-xs text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <SegmentedControl
            options={[
              { id: "ALL", label: `All (${questions.length})` },
              { id: "HLD", label: "HLD" },
              { id: "LLD", label: "LLD" },
            ]}
            value={filterType}
            onChange={setFilterType}
          />
        </div>
      </Card>

      {/* Case Studies Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item: any) => {
          const isStudied = mounted && studiedIds.includes(item.id);
          return (
            <Card
              key={item.id}
              hover
              className={cn(
                "flex h-full flex-col p-5 transition",
                isStudied && "border-success-500/40 bg-success-500/[0.02]",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span
                  className={cn(
                    "grid size-8 place-items-center rounded-lg text-xs font-bold",
                    item.type === "HLD"
                      ? "bg-blue-100 text-blue-700 border border-blue-200"
                      : "bg-purple-100 text-purple-700 border border-purple-200",
                  )}
                >
                  {item.type}
                </span>

                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => toggleStudied(item.id)}
                  className={cn(
                    "grid size-7 place-items-center rounded-lg border transition",
                    isStudied
                      ? "border-success-500/40 bg-success-500/10 text-success-600"
                      : "border-line text-ink-400 hover:text-success-600",
                  )}
                >
                  {isStudied ? <CheckCircle2 className="size-4" /> : <Circle className="size-4" />}
                </button>
              </div>

              <h3 className="mt-3 text-sm font-bold text-ink-900">{item.title}</h3>

              {item.companies && item.companies.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1">
                  {item.companies.slice(0, 4).map((c: string) => (
                    <span
                      key={c}
                      className="rounded bg-surface-elevated border border-line px-1.5 py-0.5 text-[0.65rem] font-medium text-ink-600"
                    >
                      {c}
                    </span>
                  ))}
                  {item.companies.length > 4 && (
                    <span className="rounded bg-surface-elevated px-1.5 py-0.5 text-[0.65rem] text-ink-400">
                      +{item.companies.length - 4}
                    </span>
                  )}
                </div>
              )}

              <div className="mt-auto pt-4 flex gap-2">
                {item.articleLink && (
                  <a
                    href={item.articleLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-line bg-surface py-1.5 text-xs font-semibold text-ink-700 hover:border-brand-300 hover:text-brand-600 transition"
                  >
                    <span>Read Article</span>
                    <ExternalLink className="size-3" />
                  </a>
                )}
                {item.ytLink && (
                  <a
                    href={item.ytLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 transition"
                  >
                    <Video className="size-3.5" />
                    <span className="hidden sm:inline">Video</span>
                  </a>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------ SQL Sheet ---------------------------- */

export function SqlSection() {
  const [mounted, setMounted] = useState(false);
  const [done, setDone] = useState<number[]>([]);
  const [level, setLevel] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [pageSize, setPageSize] = useState<number>(20);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("epi_sql_done");
      if (saved) setDone(JSON.parse(saved));
    } catch {}
  }, []);

  const questions = sqlSheetData.questions || [];

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const q of questions) {
      if (q.category) set.add(q.category);
    }
    return ["ALL", ...Array.from(set)];
  }, [questions]);

  const filtered = useMemo(() => {
    return questions.filter((q: any) => {
      if (level !== "ALL" && q.difficulty.toUpperCase() !== level) return false;
      if (categoryFilter !== "ALL" && q.category !== categoryFilter) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesTitle = q.title.toLowerCase().includes(query);
        const matchesCategory = (q.category || "").toLowerCase().includes(query);
        const matchesAnswer = (q.answer || "").toLowerCase().includes(query);
        if (!matchesTitle && !matchesCategory && !matchesAnswer) return false;
      }
      return true;
    });
  }, [questions, level, categoryFilter, search]);

  const effectivePageSize = pageSize === -1 ? filtered.length || 1 : pageSize;
  const totalPages = Math.ceil(filtered.length / effectivePageSize) || 1;
  const pageItems = filtered.slice(
    (page - 1) * effectivePageSize,
    page * effectivePageSize
  );

  const toggleDone = (idx: number) => {
    setDone((prev) => {
      const next = prev.includes(idx) ? prev.filter((x) => x !== idx) : [...prev, idx];
      try {
        localStorage.setItem("epi_sql_done", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleCopy = (sql: string, idx: number) => {
    navigator.clipboard?.writeText(sql);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1800);
  };

  const solvedCount = mounted ? done.length : 0;
  const percent = Math.round((solvedCount / Math.max(1, questions.length)) * 100);

  return (
    <div className="space-y-4" suppressHydrationWarning>
      {/* Top Banner & Progress */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-bold text-ink-900">Top 110 SQL Interview Queries</h2>
              <Badge tone="brand">{solvedCount} / {questions.length} solved</Badge>
            </div>
            <p className="mt-1 text-xs text-ink-500">
              Complete placement query sheet covering Basic SELECT, WHERE, Aggregations, Window Functions, Joins, and Common Table Expressions (CTEs).
            </p>
          </div>

          <div className="w-full lg:w-48">
            <ProgressBar value={percent} />
          </div>
        </div>

        {/* Category Filters */}
        <div className="mt-3.5 flex flex-wrap items-center gap-1.5 pt-3 border-t border-line">
          {categories.slice(0, 8).map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setCategoryFilter(cat);
                setPage(1);
              }}
              className={cn(
                "rounded-lg px-2.5 py-1 text-[0.72rem] font-medium transition",
                categoryFilter === cat
                  ? "bg-brand-600 text-white font-bold"
                  : "border border-line bg-surface text-ink-600 hover:bg-surface-elevated hover:text-ink-900"
              )}
            >
              {cat === "ALL" ? `All Categories (${questions.length})` : cat}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-col gap-3 pt-3 border-t border-line sm:flex-row sm:items-center sm:justify-between">
          <div className="relative min-w-0 flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              placeholder="Search SQL queries by keyword (e.g. salary, join, CTE, rank)..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-line bg-surface pl-9 pr-3 py-1.5 text-xs text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <SegmentedControl
              options={[
                { id: "ALL", label: `All (${questions.length})` },
                { id: "EASY", label: "Easy" },
                { id: "MEDIUM", label: "Medium" },
                { id: "HARD", label: "Hard" },
              ]}
              value={level}
              onChange={(next) => {
                setLevel(next);
                setPage(1);
              }}
            />

            {/* Page size dropdown */}
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(parseInt(e.target.value, 10));
                setPage(1);
              }}
              className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-semibold text-ink-700 focus:border-brand-500 focus:outline-none"
            >
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
              <option value={-1}>Show all (110)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* SQL Queries List */}
      <Card className="p-0 overflow-hidden divide-y divide-line">
        {pageItems.map((item: any) => {
          const isDone = mounted && done.includes(item.index);
          const isExpanded = expandedIndex === item.index;

          return (
            <div
              key={item.index}
              className={cn(
                "p-4 transition hover:bg-surface-elevated/40",
                isDone && "bg-success-500/[0.03]",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={() => toggleDone(item.index)}
                    className={cn(
                      "mt-0.5 grid size-6 place-items-center rounded-md border shrink-0 transition",
                      isDone
                        ? "border-success-500/40 bg-success-500/10 text-success-600"
                        : "border-line text-ink-400 hover:text-success-600",
                    )}
                  >
                    {isDone ? <CheckCircle2 className="size-4" /> : <Circle className="size-4" />}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold tabular-nums text-ink-400">#{item.index}</span>
                      <h3
                        className={cn(
                          "text-xs sm:text-sm font-semibold",
                          isDone ? "text-ink-500 line-through" : "text-ink-900",
                        )}
                      >
                        {item.title}
                      </h3>
                    </div>
                    {item.category && (
                      <span className="mt-1 inline-block text-[0.68rem] text-ink-500 font-medium">
                        Category: {item.category}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    tone={
                      item.difficulty === "Easy"
                        ? "success"
                        : item.difficulty === "Medium"
                          ? "warning"
                          : "error"
                    }
                  >
                    {item.difficulty}
                  </Badge>

                  <Button
                    size="sm"
                    variant="outline"
                    suppressHydrationWarning
                    className="h-7 text-xs px-2.5"
                    onClick={() => setExpandedIndex(isExpanded ? null : item.index)}
                  >
                    {isExpanded ? "Hide SQL" : "View SQL"}
                    {isExpanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
                  </Button>
                </div>
              </div>

              {isExpanded && item.answer && (
                <div className="mt-3.5 pl-9 space-y-2">
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-[0.7rem] font-bold uppercase tracking-wider text-ink-400">
                      Standard SQL Solution
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(item.answer, item.index)}
                      className="inline-flex items-center gap-1 text-[0.7rem] font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-2 py-0.5 rounded border border-brand-200 transition"
                    >
                      {copiedIndex === item.index ? (
                        <>
                          <Check className="size-3 text-success-600" />
                          <span className="text-success-600 font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="size-3" />
                          <span>Copy SQL</span>
                        </>
                      )}
                    </button>
                  </div>
                  <CodeBlock language="sql" code={item.answer} />
                </div>
              )}
            </div>
          );
        })}
      </Card>

      {/* Pagination Controls */}
      {pageSize !== -1 && totalPages > 1 && (
        <div className="flex items-center justify-between px-2 pt-2">
          <p className="text-xs text-ink-500">
            Showing {(page - 1) * effectivePageSize + 1}–{Math.min(page * effectivePageSize, filtered.length)} of {filtered.length} queries
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="text-xs font-semibold text-ink-700">
              Page {page} of {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Aptitude ----------------------------- */

export function AptitudeSection() {
  const [mounted, setMounted] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState(aptitudeData.topics[0].id);
  const [revealedSolutions, setRevealedSolutions] = useState<Record<string, boolean>>({});
  const [selectedOption, setSelectedOption] = useState<Record<string, string>>({});
  const [masteredIds, setMasteredIds] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("epi_aptitude_mastered");
      if (saved) setMasteredIds(JSON.parse(saved));
    } catch {}
  }, []);

  const activeTopic = aptitudeData.topics.find((t) => t.id === selectedTopicId) || aptitudeData.topics[0];

  const toggleSolution = (qId: string) => {
    setRevealedSolutions((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  const toggleMastered = (qId: string) => {
    setMasteredIds((prev) => {
      const next = prev.includes(qId) ? prev.filter((x) => x !== qId) : [...prev, qId];
      try {
        localStorage.setItem("epi_aptitude_mastered", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  return (
    <div className="space-y-6" suppressHydrationWarning>
      {/* Topic Switcher Pills */}
      <div className="flex flex-wrap gap-2">
        {aptitudeData.topics.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedTopicId(t.id)}
            className={cn(
              "rounded-xl px-3.5 py-2 text-xs font-bold transition-all shadow-xs",
              selectedTopicId === t.id
                ? "bg-brand-600 text-white shadow-brand-500/20"
                : "border border-line bg-surface text-ink-700 hover:bg-surface-elevated hover:text-ink-900",
            )}
          >
            {t.title}
          </button>
        ))}
      </div>

      {/* Selected Topic Overview & Formula Cheat Sheet */}
      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          <Card className="p-5 border-l-4 border-l-brand-500">
            <h2 className="text-base font-extrabold text-ink-900">{activeTopic.title}</h2>
            <p className="mt-1 text-xs text-ink-600 leading-relaxed">{activeTopic.summary}</p>
          </Card>

          {/* Practice Questions */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-ink-900 flex items-center justify-between">
              <span>Interactive Practice Questions</span>
              <span className="text-xs text-ink-500 font-normal">
                {mounted ? masteredIds.filter((id) => id.startsWith(activeTopic.id.slice(0, 3))).length : 0} / {activeTopic.questions.length} Mastered
              </span>
            </h3>

            {activeTopic.questions.map((q, idx) => {
              const isRevealed = revealedSolutions[q.id];
              const isMastered = mounted && masteredIds.includes(q.id);
              const userPick = selectedOption[q.id];

              return (
                <Card key={q.id} className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <span className="grid size-6 place-items-center rounded-md bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <p className="text-xs sm:text-sm font-semibold text-ink-900 leading-relaxed">
                        {q.question}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleMastered(q.id)}
                      className={cn(
                        "grid size-7 place-items-center rounded-lg border shrink-0 transition",
                        isMastered
                          ? "border-success-500/40 bg-success-500/10 text-success-600"
                          : "border-line text-ink-400 hover:text-success-600",
                      )}
                      title={isMastered ? "Mark as unmastered" : "Mark as mastered"}
                    >
                      {isMastered ? <CheckCircle2 className="size-4" /> : <Circle className="size-4" />}
                    </button>
                  </div>

                  {/* Multiple Choice Options */}
                  <div className="grid gap-2 sm:grid-cols-2 pt-1">
                    {q.options.map((opt) => {
                      const isSelected = userPick === opt;
                      const isCorrect = isRevealed && opt === q.correct;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setSelectedOption((prev) => ({ ...prev, [q.id]: opt }))}
                          className={cn(
                            "rounded-lg border px-3 py-2 text-left text-xs font-medium transition",
                            isSelected
                              ? "border-brand-500 bg-brand-50 text-brand-900 font-semibold"
                              : "border-line bg-surface text-ink-700 hover:bg-surface-elevated",
                            isCorrect && "border-success-500 bg-success-50 text-success-900 font-bold",
                          )}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {/* Solution Reveal Toggle */}
                  <div className="pt-2 flex items-center justify-between border-t border-line">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7"
                      onClick={() => toggleSolution(q.id)}
                    >
                      {isRevealed ? "Hide Solution" : "Reveal Step-by-Step Solution"}
                      {isRevealed ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
                    </Button>

                    {userPick && (
                      <span className="text-[0.7rem] font-semibold text-ink-500">
                        Answer: {userPick === q.correct ? "✅ Correct" : "❌ Incorrect"}
                      </span>
                    )}
                  </div>

                  {/* Detailed Solution Box */}
                  {isRevealed && (
                    <div className="rounded-xl border border-line bg-surface-elevated/70 p-4 space-y-2.5 text-xs animate-in fade-in">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-success-600">Correct Answer: {q.correct}</span>
                      </div>
                      <p className="text-ink-700 leading-relaxed font-normal">
                        <strong>Explanation:</strong> {q.explanation}
                      </p>
                      {q.shortcutTrick && (
                        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2.5 text-[0.72rem] text-amber-900">
                          ⚡ <strong className="font-bold">10-Second Shortcut Trick:</strong> {q.shortcutTrick}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

        {/* Formula Cheat Sheet Sidecard */}
        <aside className="space-y-4">
          <Card className="p-4 border-amber-200 bg-amber-50/20">
            <div className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-lg bg-amber-500 text-white">
                <Lightbulb className="size-4" />
              </span>
              <h3 className="text-sm font-bold text-ink-900">Formula Cheat Sheet</h3>
            </div>
            <p className="mt-1 text-[0.7rem] text-ink-500">
              High-yield formulas tested by TCS, Infosys, Cognizant, Wipro, and Accenture.
            </p>

            <div className="mt-3 divide-y divide-line/60">
              {activeTopic.formulas.map((f, i) => (
                <div key={i} className="py-2.5 first:pt-0 last:pb-0">
                  <p className="font-bold text-xs text-ink-900">{f.name}</p>
                  <p className="mt-0.5 font-mono text-[0.68rem] text-ink-600 bg-surface rounded px-1.5 py-1 border border-line">
                    {f.rule}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-bold text-ink-900">Placement Mock Tests</h3>
            <p className="mt-1 text-xs text-ink-500">
              Practice timed placement mock tests under real exam conditions.
            </p>
            <Link
              href="/placements/mock-tests"
              className="mt-3.5 inline-flex w-full h-9 items-center justify-center gap-2 rounded-lg bg-brand-600 text-xs font-bold text-white shadow-xs hover:bg-brand-700 transition"
            >
              <Trophy className="size-3.5" />
              Go to Mock Tests
            </Link>
          </Card>
        </aside>
      </div>
    </div>
  );
}

/* ------------------------- Technical subjects ------------------------ */

const TECHNICAL_SUBJECTS = [
  {
    title: "Operating Systems",
    topics: [
      "Processes & scheduling",
      "Deadlock",
      "Memory management & paging",
      "File systems",
      "Concurrency & semaphores",
    ],
    icon: Server,
    tint: "#FF5A00",
  },
  {
    title: "Database Management Systems",
    topics: [
      "Normalisation",
      "Transactions & ACID",
      "Indexing & query plans",
      "Joins & subqueries",
      "NoSQL basics",
    ],
    icon: Database,
    tint: "#2B6CB0",
  },
  {
    title: "Computer Networks",
    topics: [
      "OSI & TCP/IP",
      "Routing protocols",
      "TCP vs UDP",
      "DNS & HTTP/HTTPS",
      "Network security",
    ],
    icon: Layers,
    tint: "#22A06B",
  },
  {
    title: "Object Oriented Programming",
    topics: [
      "Encapsulation & inheritance",
      "Polymorphism",
      "Abstraction & interfaces",
      "SOLID principles",
      "Design patterns",
    ],
    icon: Code2,
    tint: "#7C3AED",
  },
];

export function TechnicalSubjectsSection() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {TECHNICAL_SUBJECTS.map((subject) => {
        const Icon = subject.icon;
        return (
          <Card key={subject.title} hover className="h-full p-5">
            <div className="flex items-start gap-3">
              <span
                className="grid size-11 shrink-0 place-items-center rounded-xl text-white"
                style={{ background: subject.tint }}
              >
                <Icon className="size-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-ink-900">
                  {subject.title}
                </h3>
                <p className="mt-0.5 text-xs text-ink-500">
                  {subject.topics.length} core topics
                </p>
              </div>
            </div>
            <ul className="mt-3.5 space-y-2">
              {subject.topics.map((topic) => (
                <li
                  key={topic}
                  className="flex items-start gap-2 text-xs text-ink-700"
                >
                  <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-warning-500" />
                  {topic}
                </li>
              ))}
            </ul>
            <Link
              href="/placements/interview-questions"
              className="mt-4 inline-flex h-9 items-center justify-center rounded-lg bg-brand-50 px-4 text-xs font-bold text-brand-600 hover:bg-brand-100"
            >
              Interview questions
            </Link>
          </Card>
        );
      })}
    </div>
  );
}

/* ------------------------ Company preparation ------------------------ */

type CompanyDetail = {
  name: string;
  logoText: string;
  tint: string;
  rounds: string;
  packages: string;
  topics: string[];
  roundsDetail: Array<{
    title: string;
    duration: string;
    summary: string;
    keyPoints: string[];
  }>;
  commonQuestions: string[];
};

const COMPANIES: CompanyDetail[] = [
  {
    name: "TCS",
    logoText: "TC",
    tint: "#1F3A93",
    rounds: "NQT Foundation · Advanced Coding · Technical + HR",
    packages: "Ninja (₹3.36 LPA) · Digital (₹7.0 LPA) · Prime (₹9.0 LPA)",
    topics: ["Aptitude", "C / Java Basics", "Arrays & Strings", "SQL Queries"],
    roundsDetail: [
      {
        title: "Round 1: TCS National Qualifier Test (NQT)",
        duration: "180 minutes",
        summary: "Comprehensive test split into Foundation Section (Mandatory for Ninja) and Advanced Section (Qualifies for Digital & Prime).",
        keyPoints: [
          "Foundation: Numerical Ability (20 Qs), Verbal Ability (25 Qs), Reasoning Ability (20 Qs).",
          "Advanced Cognitive: Quantitative & Reasoning (15 Qs).",
          "Advanced Coding: 2 coding questions (1 Easy-Medium, 1 Medium, testing arrays, matrices, and number theory).",
        ],
      },
      {
        title: "Round 2: Technical Interview",
        duration: "30–45 minutes",
        summary: "Tests core engineering fundamentals, final-year project architecture, and coding logic.",
        keyPoints: [
          "Deep dive into final year project and individual contributions.",
          "Core CS fundamentals: OOPs (Polymorphism, Inheritance), DBMS (Joins, ACID properties, Normalization).",
          "Live coding or dry-running basic algorithms (e.g. palindrome check, second largest element, prime factorization).",
        ],
      },
      {
        title: "Round 3: Managerial & HR Interview",
        duration: "15–20 minutes",
        summary: "Assesses adaptability, willingness to relocate across India, communication, and shift flexibility.",
        keyPoints: [
          "Why TCS over competitors?",
          "Scenario questions on handling deadline pressures and team conflicts.",
          "Service agreement, shifts, and background verification confirmation.",
        ],
      },
    ],
    commonQuestions: [
      "Find the count of pairs in an array with given sum.",
      "Explain the difference between clustered and non-clustered indexes in SQL.",
      "How does method overloading differ from method overriding?",
      "Write a query to find the second highest salary using subquery and dense_rank().",
    ],
  },
  {
    name: "Infosys",
    logoText: "IN",
    tint: "#007CC3",
    rounds: "Online Test (InfyTQ/HackWithInfy) · Technical Interview · HR",
    packages: "Systems Engineer (₹3.6 LPA) · DSE (₹6.5 LPA) · Specialist Programmer (₹9.5 LPA)",
    topics: ["Reasoning", "Technical MCQ", "DSA (Trees & DP)", "DBMS"],
    roundsDetail: [
      {
        title: "Round 1: Online Assessment",
        duration: "100 minutes",
        summary: "Rigorous section-timed test without negative marking covering reasoning, technical ability, and pseudocode.",
        keyPoints: [
          "Reasoning Ability (15 Qs, 25 mins) - Data sufficiency, syllogisms, puzzle tests.",
          "Technical Ability (10 Qs, 35 mins) - Mathematical critical thinking.",
          "Verbal Ability (20 Qs, 20 mins) & Pseudocode (5 Qs, 10 mins) - Code tracing, output prediction.",
          "For SP / DSE: HackWithInfy hands-on programming with 3 algorithmic problems.",
        ],
      },
      {
        title: "Round 2: Technical Interview",
        duration: "40 minutes",
        summary: "In-depth review of resume projects, SQL joins, and data structures.",
        keyPoints: [
          "Explain project data flow and technology trade-offs.",
          "Data structures: Linked lists reversal, cycle detection, stack using queue.",
          "Explain SDLC models, Agile Scrum ceremonies, and Git workflows.",
        ],
      },
      {
        title: "Round 3: HR Interview",
        duration: "15 minutes",
        summary: "Assesses cultural fit, communication clarity, and learning mindset.",
        keyPoints: [
          "Strengths and weaknesses with real-world examples.",
          "Willingness to train at the Infosys Mysore campus.",
        ],
      },
    ],
    commonQuestions: [
      "Write a function to detect a loop in a linked list (Floyd's cycle detection).",
      "What is normalization and describe 1NF, 2NF, and 3NF?",
      "Explain the differences between abstract classes and interfaces in Java.",
    ],
  },
  {
    name: "Cognizant",
    logoText: "CO",
    tint: "#1B365D",
    rounds: "GenC / GenC Elevate / GenC Next Assessment · Technical · HR",
    packages: "GenC (₹4.0 LPA) · GenC Elevate (₹4.5–5.5 LPA) · GenC Next (₹6.75–9.0 LPA)",
    topics: ["Aptitude", "Debugging / Automata Fix", "Hands-on Coding", "Web Basics"],
    roundsDetail: [
      {
        title: "Round 1: Online Assessment",
        duration: "120 minutes",
        summary: "Adaptive test covering quantitative aptitude, analytical reasoning, automata fix (debugging), and coding.",
        keyPoints: [
          "Communication Assessment: Grammar, voice reading, listening comprehension.",
          "Analytical & Quantitative Aptitude.",
          "Automata Fix: 7 syntax and logic bug-fixing questions in C/C++/Java.",
          "GenC Next coding round: 2 LeetCode Medium DSA problems.",
        ],
      },
      {
        title: "Round 2: Technical Interview",
        duration: "35 minutes",
        summary: "Evaluates programming language expertise, SQL queries, and system fundamentals.",
        keyPoints: [
          "Core Java / Python / C++ concepts and standard libraries.",
          "SQL joins, group by, having clauses, and primary vs unique keys.",
          "Web development basics (HTTP, REST, JSON, Cookies vs Sessions).",
        ],
      },
      {
        title: "Round 3: HR Discussion",
        duration: "15 minutes",
        summary: "Verifies personal documents, communication skills, and willingness to work across domains.",
        keyPoints: ["Readiness to upskill in cloud, full-stack, or AI tracks."],
      },
    ],
    commonQuestions: [
      "Fix the off-by-one error in binary search implementation.",
      "What are SQL constraints and how do you ensure referential integrity?",
      "Difference between process and thread in Operating Systems.",
    ],
  },
  {
    name: "Amazon",
    logoText: "AZ",
    tint: "#FF9900",
    rounds: "Online Assessment (OA) · 3–4 Technical Interview Loops · Bar Raiser",
    packages: "SDE-1 (₹32.0–44.0 LPA CTC)",
    topics: ["DSA (Medium-Hard)", "System Design (LLD)", "16 Leadership Principles"],
    roundsDetail: [
      {
        title: "Round 1: Online Assessment (OA)",
        duration: "90–120 minutes",
        summary: "Platform test hosted on HackerRank covering algorithmic problem solving and Amazon Work Style Assessment.",
        keyPoints: [
          "2 algorithmic problems (typically LeetCode Medium/Hard involving Trees, Graphs, Heaps, or DP).",
          "Written explanation of time and space complexity for both solutions.",
          "Work Simulation & 16 Amazon Leadership Principles assessment.",
        ],
      },
      {
        title: "Rounds 2–4: Onsite / Virtual Interview Loops",
        duration: "60 minutes each",
        summary: "Each round includes 20 minutes of behavioral questions based on Amazon Leadership Principles + 40 minutes of live coding.",
        keyPoints: [
          "Interview 1: Data structures (Trees, Graphs, BFS/DFS, Trie, Priority Queue).",
          "Interview 2: Algorithms, Dynamic Programming, and Low Level Object-Oriented Design (LLD).",
          "Interview 3: Complex problem solving, concurrency, and clean testable code.",
        ],
      },
      {
        title: "Round 5: The Bar Raiser",
        duration: "60 minutes",
        summary: "Conducted by an independent Amazon interviewer outside the hiring team to ensure the candidate raises the bar of existing talent.",
        keyPoints: [
          "Deep dive into behavioral situations using STAR format (Situation, Task, Action, Result).",
          "Customer Obsession, Ownership, Bias for Action, and Deliver Results.",
        ],
      },
    ],
    commonQuestions: [
      "Design an LRU Cache with O(1) get and put operations.",
      "Find the number of islands in a 2D grid (BFS / DFS).",
      "Serialize and deserialize a Binary Tree.",
      "Tell me about a time you faced a difficult technical challenge and how you solved it.",
    ],
  },
  {
    name: "Microsoft",
    logoText: "MS",
    tint: "#00A4EF",
    rounds: "Codility OA · 3 Technical Video Interviews · AA (As Appropriate) Round",
    packages: "SDE-1 (₹42.0–45.0 LPA CTC)",
    topics: ["DSA (Graphs & Trees)", "System Design", "OS & Concurrency"],
    roundsDetail: [
      {
        title: "Round 1: Online Coding Assessment (Codility)",
        duration: "80 minutes",
        summary: "Codility platform test with 2 or 3 algorithmic problems evaluating code correctness, efficiency, and edge case coverage.",
        keyPoints: [
          "Edge case testing (empty arrays, integer overflow, duplicates).",
          "String manipulation, sliding window, and graph traversals.",
        ],
      },
      {
        title: "Rounds 2–3: Technical Video Interviews",
        duration: "60 minutes each",
        summary: "Live interactive coding with Microsoft engineers focusing on problem-solving thought process and production-quality code.",
        keyPoints: [
          "Write clean, modular, and idiomatic code on Microsoft Teams / CodeTour.",
          "Operating Systems: Threads, locks, race conditions, memory management.",
          "System Design / LLD: Design a parking lot, rate limiter, or tic-tac-toe game.",
        ],
      },
      {
        title: "Round 4: Partner / Hiring Manager Interview",
        duration: "45–60 minutes",
        summary: "Architectural alignment, growth mindset, and cultural evaluation.",
        keyPoints: [
          "Why Microsoft and how do you align with 'Empowering every person on the planet'?",
          "Handling trade-offs and receiving architectural critiques.",
        ],
      },
    ],
    commonQuestions: [
      "Find the lowest common ancestor (LCA) in a Binary Tree.",
      "Detect and resolve deadlocks in a multithreaded program.",
      "Design an elevator system using object-oriented principles.",
    ],
  },
  {
    name: "Google",
    logoText: "GO",
    tint: "#4285F4",
    rounds: "Online Challenge · 3–4 Technical Coding Rounds · Googleyness & Leadership",
    packages: "Software Engineer (₹40.0–48.0 LPA CTC)",
    topics: ["DSA (Advanced)", "Graph Theory", "Dynamic Programming", "Googleyness"],
    roundsDetail: [
      {
        title: "Round 1: Google Online Challenge (GOC)",
        duration: "60 minutes",
        summary: "2 challenging algorithmic problems hosted on Google's testing platform.",
        keyPoints: [
          "Dynamic programming, combinatorics, and graph traversal.",
          "Strict execution time limits requiring optimal O(N) or O(N log N) solutions.",
        ],
      },
      {
        title: "Rounds 2–4: Technical Phone & Video Interviews",
        duration: "45 minutes each",
        summary: "Collaborative problem-solving in a shared Google Doc without compiler autocomplete.",
        keyPoints: [
          "Clarify ambiguous requirements and outline high-level approaches before writing code.",
          "Discuss exact asymptotic complexity and possible trade-offs.",
          "Structure clean, readable code with descriptive variable names.",
        ],
      },
      {
        title: "Round 5: Googleyness & Leadership",
        duration: "45 minutes",
        summary: "Evaluates intellectual humility, bias to action, ethical judgment, and collaborative mindset.",
        keyPoints: [
          "How do you resolve technical disagreements with teammates?",
          "Navigating ambiguous project goals without clear directions.",
        ],
      },
    ],
    commonQuestions: [
      "Word Ladder II — find all shortest transformation sequences.",
      "Design an autocomplete system with Trie and ranking.",
      "Shortest path in a weighted DAG with negative edge weights.",
    ],
  },
];

export function CompanyPreparationSection() {
  const [selectedCompany, setSelectedCompany] = useState<CompanyDetail | null>(null);

  return (
    <div className="space-y-6" suppressHydrationWarning>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {COMPANIES.map((company) => (
          <Card key={company.name} hover className="flex h-full flex-col p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className="grid size-12 shrink-0 place-items-center rounded-xl text-base font-extrabold text-white shadow-xs"
                  style={{ background: company.tint }}
                >
                  {company.logoText}
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-ink-900">{company.name}</h3>
                  <p className="text-[0.7rem] font-medium text-ink-500">{company.packages}</p>
                </div>
              </div>
            </div>

            <p className="mt-3 text-xs text-ink-600 line-clamp-2">
              <strong>Hiring Rounds:</strong> {company.rounds}
            </p>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {company.topics.map((topic) => (
                <span
                  key={topic}
                  className="rounded-md bg-surface-elevated border border-line px-2 py-0.5 text-[0.68rem] font-semibold text-ink-700"
                >
                  {topic}
                </span>
              ))}
            </div>

            <div className="mt-auto pt-4 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs"
                onClick={() => setSelectedCompany(company)}
              >
                View Syllabus & Rounds
              </Button>
              <Link
                href={`/jobs?q=${encodeURIComponent(company.name)}`}
                className="inline-flex h-9 items-center justify-center rounded-lg bg-brand-500 px-3 text-xs font-bold text-white hover:bg-brand-600 transition"
              >
                Jobs
              </Link>
            </div>
          </Card>
        ))}
      </div>

      {/* Company Preparation Detail Modal */}
      {selectedCompany && (
        <Modal
          open={Boolean(selectedCompany)}
          onClose={() => setSelectedCompany(null)}
          title={`${selectedCompany.name} — Placement Preparation Hub`}
          footer={
            <div className="flex flex-wrap items-center justify-between w-full gap-2">
              <span className="text-xs text-ink-500 font-medium">
                Target Salary: {selectedCompany.packages}
              </span>
              <div className="flex gap-2">
                <Link href="/placements/dsa-sheets">
                  <Button size="sm" variant="outline">
                    Practice DSA
                  </Button>
                </Link>
                <Link href="/placements/mock-tests">
                  <Button size="sm" variant="primary">
                    Start Mock Test
                  </Button>
                </Link>
                <Button size="sm" variant="secondary" onClick={() => setSelectedCompany(null)}>
                  Close
                </Button>
              </div>
            </div>
          }
        >
          <div className="max-h-[65vh] overflow-y-auto space-y-5 pr-1">
            {/* Header info */}
            <div className="rounded-xl border border-line bg-surface-elevated p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-ink-500 uppercase tracking-wider">Salary Packages Offered</p>
                <p className="text-sm font-extrabold text-ink-900 mt-0.5">{selectedCompany.packages}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedCompany.topics.map((t) => (
                  <Badge key={t} tone="brand">{t}</Badge>
                ))}
              </div>
            </div>

            {/* Rounds Breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-500">
                Detailed Round-by-Round Breakdown
              </h4>
              <div className="space-y-2.5">
                {selectedCompany.roundsDetail.map((r, idx) => (
                  <div key={idx} className="rounded-xl border border-line p-3.5 space-y-2 bg-surface">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold text-ink-900">{r.title}</h5>
                      <span className="text-[0.68rem] font-semibold text-ink-500 rounded bg-line/60 px-2 py-0.5">
                        {r.duration}
                      </span>
                    </div>
                    <p className="text-xs text-ink-600 leading-relaxed">{r.summary}</p>
                    <ul className="list-disc pl-4 text-xs text-ink-700 space-y-1">
                      {r.keyPoints.map((pt, pIdx) => (
                        <li key={pIdx}>{pt}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Common Interview Questions */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-500">
                Most Asked Technical Questions at {selectedCompany.name}
              </h4>
              <div className="rounded-xl border border-line divide-y divide-line bg-surface">
                {selectedCompany.commonQuestions.map((q, qIdx) => (
                  <div key={qIdx} className="p-3 text-xs flex items-start gap-2.5">
                    <span className="font-bold text-brand-600 shrink-0">#{qIdx + 1}</span>
                    <span className="text-ink-800 font-medium">{q}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ----------------------- Interview questions ------------------------- */

export function InterviewQuestionsSection() {
  const { push } = useToast();
  const [category, setCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>("acid-properties");

  const categories = [
    { id: "all", label: "All Questions" },
    { id: "dbms", label: "DBMS" },
    { id: "os", label: "Operating Systems" },
    { id: "cn", label: "Computer Networks" },
    { id: "oop", label: "OOP & Languages" },
    { id: "web", label: "Web & APIs" },
    { id: "hr", label: "HR & Behavioral" },
  ];

  const filtered = useMemo(() => {
    return (interviewQuestionsData as any[]).filter((q) => {
      if (category !== "all" && q.category !== category) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        const inQuestion = q.question.toLowerCase().includes(query);
        const inSummary = (q.summary || "").toLowerCase().includes(query);
        const inTags = (q.tags || []).some((t: string) => t.toLowerCase().includes(query));
        if (!inQuestion && !inSummary && !inTags) return false;
      }
      return true;
    });
  }, [category, search]);

  const copyAnswer = (q: any) => {
    const text = `${q.question}\n\nSummary:\n${q.summary}\n\nKey Points:\n${q.answer.map((a: string, i: number) => `${i + 1}. ${a}`).join("\n")}\n\nLikely Follow-up:\n${q.followUp}`;
    navigator.clipboard.writeText(text);
    push({
      title: "Copied to Clipboard",
      description: "Answer summary copied to clipboard.",
      tone: "success",
    });
  };

  return (
    <div className="space-y-5">
      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative min-w-0 flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              placeholder="Search interview questions by topic, keyword, or concept..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-line bg-surface pl-9 pr-3 py-1.5 text-xs text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-ink-400 hover:text-ink-700"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCategory(tab.id)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                  category === tab.id
                    ? "bg-brand-600 text-white shadow-xs"
                    : "border border-line bg-surface text-ink-600 hover:bg-surface-elevated hover:text-ink-900"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Header Info */}
      <div className="flex items-center justify-between text-xs text-ink-500 px-1">
        <span>
          Showing <span className="font-bold text-ink-900">{filtered.length}</span> verified interview questions
        </span>
        <span className="text-[0.7rem] text-ink-400">
          Click any question card to expand in-depth explanations & follow-up questions
        </span>
      </div>

      {/* Questions List */}
      {filtered.length === 0 ? (
        <Card className="p-10 text-center text-sm text-ink-500">
          No interview questions match your search or filter.
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((item: any) => {
            const isExpanded = expandedId === item.id;
            return (
              <Card
                key={item.id}
                className="overflow-hidden p-0 border border-line bg-surface transition hover:border-brand-300"
              >
                <div
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="flex cursor-pointer items-start justify-between gap-3 p-4 sm:p-5 hover:bg-surface-elevated transition select-none"
                >
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="neutral" className="text-[0.65rem] font-bold uppercase tracking-wider">
                        {item.category}
                      </Badge>
                      <Badge
                        tone={item.frequency.includes("High") ? "brand" : "info"}
                        className="text-[0.65rem]"
                      >
                        {item.frequency}
                      </Badge>
                      <span className="text-[0.7rem] font-medium text-ink-400">
                        {item.difficulty}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-ink-900 leading-snug">
                      {item.question}
                    </h3>

                    <p className="text-xs text-ink-500 leading-relaxed">
                      {item.summary}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="size-7 p-0 text-ink-400 hover:text-ink-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyAnswer(item);
                      }}
                      title="Copy Answer Summary"
                    >
                      <Copy className="size-3.5" />
                    </Button>
                    <div className="text-ink-400">
                      {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-line bg-surface-elevated/50 p-4 sm:p-5 space-y-4">
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-ink-500">
                        Model Answer & Core Arguments
                      </h4>
                      <div className="space-y-2">
                        {item.answer.map((point: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-2.5 text-xs text-ink-700 leading-relaxed">
                            <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[0.65rem] font-bold text-brand-700">
                              {idx + 1}
                            </span>
                            <span>{point}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {item.followUp && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 flex items-start gap-3">
                        <HelpCircle className="size-4 text-amber-600 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-amber-900">
                            Interviewer Follow-up Question:
                          </p>
                          <p className="mt-0.5 text-xs text-amber-800 leading-relaxed">
                            "{item.followUp}"
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                      <div className="flex flex-wrap gap-1.5">
                        {(item.tags || []).map((t: string) => (
                          <span
                            key={t}
                            className="rounded-md bg-surface border border-line px-2 py-0.5 text-[0.65rem] font-medium text-ink-500"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => copyAnswer(item)}
                      >
                        <Copy className="size-3.5" />
                        <span>Copy Model Answer</span>
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* -------------------------- Challenge -------------------------------- */

export function ChallengeSection() {
  const { push } = useToast();
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<number | "all">("all");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("engineerprep_challenge_completed_days");
      if (saved) {
        setCompletedDays(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load completed challenge days", e);
    }
  }, []);

  const toggleDay = (day: number) => {
    setCompletedDays((prev) => {
      const next = prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day];
      try {
        localStorage.setItem("engineerprep_challenge_completed_days", JSON.stringify(next));
      } catch (e) {
        console.error("Failed to save challenge progress", e);
      }
      if (!prev.includes(day)) {
        push({
          title: `Day ${day} Completed!`,
          description: "Progress saved. Keep pushing your placement preparation!",
          tone: "success",
        });
      }
      return next;
    });
  };

  const resetProgress = () => {
    if (window.confirm("Are you sure you want to reset your 30-Day Challenge progress?")) {
      setCompletedDays([]);
      try {
        localStorage.removeItem("engineerprep_challenge_completed_days");
      } catch (e) {
        console.error(e);
      }
      push({
        title: "Progress Reset",
        description: "Your 30-day challenge checklist has been reset.",
        tone: "info",
      });
    }
  };

  const filteredDays = useMemo(() => {
    return (challengeData as any[]).filter((d) => {
      if (selectedWeek !== "all" && d.week !== selectedWeek) return false;
      return true;
    });
  }, [selectedWeek]);

  const totalDays = 30;
  const completedCount = completedDays.length;
  const progressPercent = Math.round((completedCount / totalDays) * 100);

  return (
    <div className="space-y-6">
      {/* Progress Milestone Banner */}
      <Card className="overflow-hidden border border-brand-200 bg-gradient-to-br from-brand-50/80 via-surface to-brand-50/40 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-brand-600 text-white shadow-xs">
                <Trophy className="size-4" />
              </span>
              <h3 className="text-base font-bold text-ink-900">
                Your 30-Day Placement Challenge Tracker
              </h3>
            </div>
            <p className="text-xs text-ink-600">
              Structured daily curriculum covering high-yield DSA patterns, DBMS, OS, Networks, and Aptitude.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xl font-extrabold text-brand-700">
                {completedCount} <span className="text-xs font-semibold text-ink-500">/ {totalDays} Days</span>
              </span>
              <p className="text-[0.7rem] font-bold text-ink-500">
                {progressPercent}% Completed
              </p>
            </div>
            {completedCount > 0 && (
              <Button
                size="sm"
                variant="ghost"
                className="text-xs text-ink-400 hover:text-ink-700 h-8 px-2"
                onClick={resetProgress}
                title="Reset Progress"
              >
                <RotateCcw className="size-3.5" />
              </Button>
            )}
          </div>
        </div>

        <div className="mt-4">
          <ProgressBar value={progressPercent} size="md" />
        </div>
      </Card>

      {/* Week Selector Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: "all", label: "All 30 Days" },
          { id: 1, label: "Week 1: Foundations & Arrays" },
          { id: 2, label: "Week 2: Stacks, Binary Search & SQL" },
          { id: 3, label: "Week 3: Trees, Graphs & Networks" },
          { id: 4, label: "Week 4: DP, System Design & Mocks" },
        ].map((tab) => (
          <button
            key={String(tab.id)}
            onClick={() => setSelectedWeek(tab.id as any)}
            className={cn(
              "rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors",
              selectedWeek === tab.id
                ? "bg-brand-600 text-white shadow-xs"
                : "border border-line bg-surface text-ink-600 hover:bg-surface-elevated hover:text-ink-900"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Day Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredDays.map((item: any) => {
          const isDone = completedDays.includes(item.day);
          return (
            <Card
              key={item.day}
              className={cn(
                "flex flex-col justify-between p-4 sm:p-5 border transition-all duration-200",
                isDone
                  ? "border-emerald-300 bg-emerald-50/30"
                  : "border-line bg-surface hover:border-brand-300 hover:shadow-xs"
              )}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-md px-2 py-0.5 text-[0.7rem] font-extrabold uppercase tracking-wide",
                        isDone
                          ? "bg-emerald-600 text-white"
                          : "bg-brand-100 text-brand-800"
                      )}
                    >
                      Day {item.day}
                    </span>
                    <span className="text-[0.68rem] font-semibold text-ink-400">
                      Week {item.week}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[0.7rem] font-medium text-ink-500">
                    <Clock className="size-3 text-ink-400" />
                    <span>{item.estimatedTime}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-ink-900 line-clamp-1">
                    {item.title}
                  </h4>
                  <p className="mt-0.5 text-[0.68rem] font-medium text-brand-600">
                    {item.domain}
                  </p>
                </div>

                <div className="space-y-1.5 pt-1">
                  {item.tasks.map((task: string, tIdx: number) => (
                    <div key={tIdx} className="flex items-start gap-2 text-[0.72rem] text-ink-700 leading-tight">
                      <span className="mt-1 size-1.5 shrink-0 rounded-full bg-brand-500" />
                      <span>{task}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-line flex items-center justify-between gap-2">
                <button
                  onClick={() => toggleDay(item.day)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer select-none",
                    isDone
                      ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                      : "bg-surface-elevated text-ink-600 hover:bg-ink-100 border border-line"
                  )}
                >
                  {isDone ? (
                    <>
                      <CheckCircle2 className="size-3.5 text-emerald-600" />
                      <span>Done</span>
                    </>
                  ) : (
                    <>
                      <Circle className="size-3.5 text-ink-400" />
                      <span>Mark Complete</span>
                    </>
                  )}
                </button>

                <Link
                  href={item.resourceLink}
                  className="inline-flex items-center gap-1 text-[0.7rem] font-bold text-brand-600 hover:text-brand-700 hover:underline"
                >
                  <span>Practice</span>
                  <ExternalLink className="size-3" />
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
