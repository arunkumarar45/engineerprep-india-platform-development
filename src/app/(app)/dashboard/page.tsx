import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { getSessionUser } from "@/lib/auth";
import {
  getDashboardSummary,
  getDsaProgress,
  getLearningActivity,
  getNotifications,
  getRoadmap,
  getRoadmapProgress,
  getRoadmaps,
  getStreak,
} from "@/lib/queries";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/dashboard");

  const [summary, streak, notifications, activity, progress, roadmaps, roadmapProgress] =
    await Promise.all([
      getDashboardSummary(user.id),
      getStreak(user.id),
      getNotifications(user.id),
      getLearningActivity(user.id),
      getDsaProgress(user.id),
      getRoadmaps(),
      getRoadmapProgress(user.id),
    ]);

  // Continue learning
  const twoPointer = roadmaps.find((r) => r.slug === "full-stack-developer-roadmap");
  const completedTopics = twoPointer
    ? (roadmapProgress.get(twoPointer.id)?.size ?? 0)
    : 0;
  const roadmapPercent = twoPointer?.stepCount
    ? Math.round((completedTopics / twoPointer.stepCount) * 100)
    : 0;

  const continueLearning: Array<{
    title: string;
    detail: string;
    progress: number;
    href: string;
    icon: "code" | "route" | "percent" | "tests";
  }> = [
    {
      title: "Two Pointers Pattern",
      detail: `Pattern ${Math.min(progress.size, 4)} / 12 problems completed`,
      progress: Math.round((Math.min(progress.size, 4) / 12) * 100),
      href: "/placements/dsa-patterns/two-pointers",
      icon: "code",
    },
    {
      title: "Full Stack Roadmap",
      detail: `${completedTopics} of ${twoPointer?.stepCount ?? 0} topics completed`,
      progress: roadmapPercent,
      href: "/placements/roadmaps/full-stack-developer-roadmap",
      icon: "route",
    },
    {
      title: "Aptitude Mock Test",
      detail:
        summary.testsCompleted > 0
          ? `Last average score ${summary.avgScore}%`
          : "Not attempted yet",
      progress: summary.avgScore,
      href: "/placements/mock-tests",
      icon: "percent",
    },
    {
      title: "Mock Test History",
      detail: `${summary.testsCompleted} tests completed`,
      progress: Math.min(100, summary.testsCompleted * 20),
      href: "/my-tests",
      icon: "tests",
    },
  ];

  const lastAttempt = summary.attempts.find((a) => a.status !== "IN_PROGRESS");
  void lastAttempt;

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: "Student Dashboard" }]}
        title="Student Dashboard"
        subtitle="Your preparation, progress and opportunities in one place."
      />

      <DashboardView
        firstName={user.fullName.split(" ")[0]}
        data={{
          dsaSolved: summary.dsaSolved,
          dsaTotal: summary.dsaTotal,
          testsCompleted: summary.testsCompleted,
          avgScore: summary.avgScore,
          applications: summary.applications,
          applicationsInProgress: summary.applicationsInProgress,
          savedJobs: summary.savedJobs,
          streak: streak
            ? {
                currentStreak: streak.currentStreak,
                longestStreak: streak.longestStreak,
                dailyGoal: streak.dailyGoal,
              }
            : null,
          continueLearning,
          alerts: notifications.slice(0, 6).map((n) => ({
            id: n.id,
            title: n.title,
            body: n.body,
            linkUrl: n.linkUrl,
            createdAt: n.createdAt,
            type: n.type,
          })),
          activity: activity.map((a) => ({
            id: a.id,
            title: a.title,
            detail: a.detail,
            occurredAt: a.occurredAt,
            activityType: a.activityType,
            points: a.points,
          })),
        }}
      />
    </>
  );
}
