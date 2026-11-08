"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  Briefcase,
  CalendarClock,
  Check,
  CheckCheck,
  Clock,
  ListChecks,
  Trophy,
} from "lucide-react";
import { Button, Card, useToast } from "@/components/ui";
import { cn, relativeTime } from "@/lib/utils";

type Item = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: Date | string;
};

const ICONS: Record<string, typeof Bell> = {
  VTU_UPDATE: CalendarClock,
  JOB_ALERT: Briefcase,
  INTERNSHIP_ALERT: Briefcase,
  APPLICATION_UPDATE: Briefcase,
  DEADLINE_REMINDER: Clock,
  DSA_REMINDER: ListChecks,
  ROADMAP_REMINDER: ListChecks,
  MOCK_TEST_REMINDER: ListChecks,
  WEEKLY_REPORT: Trophy,
  SYSTEM: Bell,
};

export function NotificationList({ notifications }: { notifications: Item[] }) {
  const router = useRouter();
  const { push } = useToast();
  const [items, setItems] = useState(notifications);
  const [busy, setBusy] = useState(false);

  async function markAll() {
    setBusy(true);
    try {
      await fetch("/api/v1/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "read-all" }),
      });
      setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
      push({ title: "All notifications marked as read", tone: "success" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function markOne(id: string) {
    await fetch("/api/v1/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isRead: true } : item)),
    );
    router.refresh();
  }

  const unread = items.filter((item) => !item.isRead).length;

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Button variant="outline" size="sm" onClick={markAll} loading={busy} disabled={unread === 0}>
          <CheckCheck className="size-3.5" /> Mark all read
        </Button>
      </div>
      <Card className="divide-y divide-line p-0">
        {items.map((item) => {
          const Icon = ICONS[item.type] ?? Bell;
          return (
            <div
              key={item.id}
              className={cn(
                "flex items-start gap-3 px-5 py-4",
                !item.isRead && "bg-brand-50/40",
              )}
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-500">
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold text-ink-900">{item.title}</p>
                  {!item.isRead && (
                    <span className="rounded-full bg-brand-500 px-1.5 py-0.5 text-[0.6rem] font-bold text-white">
                      New
                    </span>
                  )}
                </div>
                {item.body && (
                  <p className="mt-1 text-xs leading-relaxed text-ink-500">
                    {item.body}
                  </p>
                )}
                <p className="mt-1 text-[0.65rem] text-ink-500">
                  {relativeTime(item.createdAt)} · {item.type.replace(/_/g, " ")}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {item.linkUrl && (
                  <Link
                    href={item.linkUrl}
                    onClick={() => markOne(item.id)}
                    className="inline-flex h-8 items-center rounded-lg border border-line px-3 text-xs font-bold text-ink-900 hover:border-brand-300 hover:text-brand-600"
                  >
                    Open
                  </Link>
                )}
                {!item.isRead && (
                  <button
                    onClick={() => markOne(item.id)}
                    aria-label="Mark as read"
                    className="grid size-8 place-items-center rounded-lg border border-line text-ink-500 hover:text-success-500"
                  >
                    <Check className="size-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
