/**
 * Dashboard, Notifications, and Roadmap services — EngineerPrep India client
 */
import { api, type ApiResult } from "./api";

/* ------------------------------------------------------------------ */
/* Dashboard                                                            */
/* ------------------------------------------------------------------ */

export interface DashboardSummary {
  dsaCompleted: number;
  dsaTotal: number;
  roadmapProgress: number;
  testsAttempted: number;
  applicationsSubmitted: number;
  streakDays: number;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    createdAt: string;
  }>;
}

export async function getDashboardSummary(): Promise<ApiResult<DashboardSummary>> {
  return api.get<DashboardSummary>("/api/v1/dashboard");
}

export async function getStudentStreak(): Promise<
  ApiResult<{
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: string | null;
  }>
> {
  return api.get("/api/v1/dashboard/streak");
}

/* ------------------------------------------------------------------ */
/* Notifications                                                        */
/* ------------------------------------------------------------------ */

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string | null;
  isRead: boolean;
  createdAt: string;
}

export async function getNotifications(): Promise<ApiResult<Notification[]>> {
  return api.get<Notification[]>("/api/v1/notifications");
}

export async function markNotificationRead(
  id: string,
): Promise<ApiResult<null>> {
  return api.put(`/api/v1/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<ApiResult<null>> {
  return api.put("/api/v1/notifications/read-all");
}

export async function deleteNotification(id: string): Promise<ApiResult<null>> {
  return api.delete(`/api/v1/notifications/${id}`);
}

/* ------------------------------------------------------------------ */
/* Roadmaps                                                             */
/* ------------------------------------------------------------------ */

export interface RoadmapTopic {
  id: string;
  stageId: string;
  title: string;
  resourceUrl?: string | null;
  resourceLabel?: string | null;
  estimatedMinutes?: number | null;
  orderIndex: number;
  completed?: boolean;
}

export interface RoadmapStage {
  id: string;
  roadmapId: string;
  title: string;
  description?: string | null;
  orderIndex: number;
  topics: RoadmapTopic[];
  completedTopics?: number;
}

export interface Roadmap {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  category: string;
  coverImageUrl?: string | null;
  coverTint?: string | null;
  icon?: string | null;
  stepCount: number;
  estimatedDuration?: string | null;
  difficulty: string;
  stages?: RoadmapStage[];
  progressPercent?: number;
}

export async function getRoadmaps(
  category?: string,
): Promise<ApiResult<Roadmap[]>> {
  const qs = category ? `?category=${encodeURIComponent(category)}` : "";
  return api.get<Roadmap[]>(`/api/v1/roadmaps${qs}`);
}

export async function getRoadmap(slug: string): Promise<ApiResult<Roadmap>> {
  return api.get<Roadmap>(`/api/v1/roadmaps/${slug}`);
}

export async function markTopicComplete(
  topicId: string,
): Promise<ApiResult<null>> {
  return api.post(`/api/v1/roadmaps/progress`, { topicId, completed: true });
}

export async function markTopicIncomplete(
  topicId: string,
): Promise<ApiResult<null>> {
  return api.post(`/api/v1/roadmaps/progress`, { topicId, completed: false });
}

export async function getRoadmapProgress(): Promise<
  ApiResult<{ topicId: string; completed: boolean }[]>
> {
  return api.get("/api/v1/roadmaps/progress");
}

/* ------------------------------------------------------------------ */
/* Mock Tests                                                           */
/* ------------------------------------------------------------------ */

export interface MockTest {
  id: string;
  title: string;
  subject: string;
  description?: string | null;
  difficulty: string;
  durationMinutes: number;
  totalMarks: number;
  questionCount?: number;
  isPublished: boolean;
  createdAt: string;
}

export interface TestAttempt {
  id: string;
  testId: string;
  userId: string;
  status: string;
  score?: number | null;
  startedAt: string;
  submittedAt?: string | null;
}

export async function getMockTests(): Promise<ApiResult<MockTest[]>> {
  return api.get<MockTest[]>("/api/v1/mock-tests");
}

export async function getMockTest(id: string): Promise<ApiResult<MockTest>> {
  return api.get<MockTest>(`/api/v1/mock-tests/${id}`);
}

export async function startTestAttempt(
  testId: string,
): Promise<ApiResult<TestAttempt>> {
  return api.post<TestAttempt>(`/api/v1/mock-tests/${testId}/attempt`);
}

export async function submitTestAttempt(
  attemptId: string,
  responses: Array<{ questionId: string; selectedOptionId: string }>,
): Promise<ApiResult<{ score: number; total: number; percentage: number }>> {
  return api.post(`/api/v1/mock-tests/attempts/${attemptId}/submit`, {
    responses,
  });
}

export async function getMyAttempts(): Promise<ApiResult<TestAttempt[]>> {
  return api.get<TestAttempt[]>("/api/v1/mock-tests/attempts");
}

