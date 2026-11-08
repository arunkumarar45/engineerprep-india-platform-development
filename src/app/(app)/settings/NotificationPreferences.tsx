"use client";

import { useState } from "react";
import { Bell, Clock, Mail, Moon, Save, Sun } from "lucide-react";
import { Button, Card, Select, Switch, useToast } from "@/components/ui";

type Preference = {
  vtuUpdates: boolean;
  jobAlerts: boolean;
  internshipAlerts: boolean;
  applicationUpdates: boolean;
  deadlineReminders: boolean;
  dsaReminders: boolean;
  roadmapReminders: boolean;
  mockTestReminders: boolean;
  weeklyReports: boolean;
  emailNotifications: boolean;
  inAppNotifications: boolean;
  timezone: string;
  reminderTime: string;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  digestFrequency: string;
};

const DEFAULTS: Preference = {
  vtuUpdates: true,
  jobAlerts: true,
  internshipAlerts: true,
  applicationUpdates: true,
  deadlineReminders: true,
  dsaReminders: true,
  roadmapReminders: true,
  mockTestReminders: true,
  weeklyReports: true,
  emailNotifications: false,
  inAppNotifications: true,
  timezone: "Asia/Kolkata",
  reminderTime: "19:00",
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
  digestFrequency: "WEEKLY",
};

const TOGGLES: Array<{
  key: keyof Preference;
  label: string;
  description: string;
}> = [
  {
    key: "vtuUpdates",
    label: "VTU updates",
    description: "New circulars, time tables and examination notifications.",
  },
  {
    key: "jobAlerts",
    label: "Job alerts",
    description: "Full-time roles matching your branch and batch.",
  },
  {
    key: "internshipAlerts",
    label: "Internship alerts",
    description: "Internship and off-campus drive notifications.",
  },
  {
    key: "applicationUpdates",
    label: "Application updates",
    description: "Status changes on roles you have applied to.",
  },
  {
    key: "deadlineReminders",
    label: "Deadline reminders",
    description: "Reminders 7, 3 and 1 day before an application closes.",
  },
  {
    key: "dsaReminders",
    label: "DSA reminders",
    description: "Nudges to continue your DSA sheets and patterns.",
  },
  {
    key: "roadmapReminders",
    label: "Roadmap reminders",
    description: "Reminders about incomplete roadmap topics.",
  },
  {
    key: "mockTestReminders",
    label: "Mock test reminders",
    description: "Upcoming and scheduled mock test alerts.",
  },
  {
    key: "weeklyReports",
    label: "Weekly reports",
    description: "A weekly digest of your learning activity.",
  },
];

export function NotificationPreferences({
  preference,
}: {
  preference: Partial<Preference> | null;
}) {
  const { push } = useToast();
  const [values, setValues] = useState<Preference>({
    ...DEFAULTS,
    ...(preference ?? {}),
  });
  const [saving, setSaving] = useState(false);

  function update<K extends keyof Preference>(key: K, value: Preference[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/v1/notifications/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      push({
        title: res.ok ? "Preferences saved" : "Save failed",
        description: json.message,
        tone: res.ok ? "success" : "error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
      <Card className="p-0">
        <div className="border-b border-line px-5 py-4">
          <h2 className="flex items-center gap-2 text-sm font-bold text-ink-900">
            <Bell className="size-4 text-brand-500" /> Notification channels
          </h2>
          <p className="mt-0.5 text-xs text-ink-500">
            Choose what you want to hear about and how.
          </p>
        </div>
        <div className="divide-y divide-line px-5">
          {TOGGLES.map((item) => (
            <Switch
              key={item.key}
              label={item.label}
              description={item.description}
              checked={Boolean(values[item.key])}
              onChange={(next) => update(item.key, next as Preference[typeof item.key])}
            />
          ))}
        </div>
        <div className="border-t border-line px-5 py-4">
          <Switch
            label="Email notifications"
            description="Requires SMTP configuration on the server. Disabled in this demo."
            checked={values.emailNotifications}
            onChange={(next) => update("emailNotifications", next)}
          />
          <Switch
            label="In-app notifications"
            description="Show alerts inside the EngineerPrep India dashboard."
            checked={values.inAppNotifications}
            onChange={(next) => update("inAppNotifications", next)}
          />
        </div>
      </Card>

      <div className="space-y-4">
        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-ink-900">
            <Clock className="size-4 text-brand-500" /> Delivery schedule
          </h2>
          <div className="mt-3.5 grid gap-3.5">
            <div>
              <p className="epi-label">Timezone</p>
              <Select
                value={values.timezone}
                onChange={(e) => update("timezone", e.target.value)}
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="Asia/Dubai">Asia/Dubai</option>
                <option value="Europe/London">Europe/London</option>
                <option value="America/New_York">America/New_York</option>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="epi-label">Reminder time</p>
                <Select
                  value={values.reminderTime}
                  onChange={(e) => update("reminderTime", e.target.value)}
                >
                  {["07:00", "09:00", "12:00", "18:00", "19:00", "21:00"].map(
                    (time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ),
                  )}
                </Select>
              </div>
              <div>
                <p className="epi-label">Digest frequency</p>
                <Select
                  value={values.digestFrequency}
                  onChange={(e) => update("digestFrequency", e.target.value)}
                >
                  {["DAILY", "WEEKLY", "MONTHLY", "OFF"].map((freq) => (
                    <option key={freq} value={freq}>
                      {freq}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <p className="epi-label">Quiet hours start</p>
                <Select
                  value={values.quietHoursStart ?? "22:00"}
                  onChange={(e) => update("quietHoursStart", e.target.value)}
                >
                  {["21:00", "22:00", "23:00"].map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <p className="epi-label">Quiet hours end</p>
                <Select
                  value={values.quietHoursEnd ?? "07:00"}
                  onChange={(e) => update("quietHoursEnd", e.target.value)}
                >
                  {["06:00", "07:00", "08:00"].map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-ink-900">
            <Mail className="size-4 text-brand-500" /> Email integration
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-ink-500">
            This demo does not send real emails. Enabling email notifications
            requires SMTP credentials on the server — see the project README for
            the required environment variables.
          </p>
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-warning-500/10 px-3 py-2 text-[0.7rem] font-semibold text-[#a56a00]">
            <Moon className="size-3.5" /> Quiet hours are always respected
            <Sun className="size-3.5" />
          </p>
        </Card>

        <Button block loading={saving} onClick={save}>
          <Save className="size-4" /> Save preferences
        </Button>
      </div>
    </div>
  );
}
