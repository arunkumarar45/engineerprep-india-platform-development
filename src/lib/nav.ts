import type { LucideIcon } from "lucide-react";
import {
  Bell,
  BookMarked,
  BookOpen,
  Briefcase,
  Building2,
  CalendarClock,
  ClipboardList,
  Code2,
  Database,
  FileStack,
  FileText,
  Flame,
  GraduationCap,
  Home,
  LayoutDashboard,
  ListChecks,
  MessagesSquare,
  NotebookPen,
  Percent,
  Radar,
  Route,
  ScrollText,
  Settings,
  Sparkles,
  SquareStack,
  Trophy,
  Upload,
  Users,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
};

export type NavSection = {
  id: string;
  label: string;
  items: NavItem[];
};

export const TOP_NAV: NavItem[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "VTU Notes", href: "/vtu", icon: BookOpen },
  { label: "Placements", href: "/placements", icon: Code2 },
  { label: "Jobs", href: "/jobs", icon: Briefcase },
  { label: "Resources", href: "/vtu/resources", icon: FileStack },
];

export const SIDEBARS: Record<string, NavSection> = {
  vtu: {
    id: "vtu",
    label: "VTU Notes & Resources",
    items: [
      { label: "Overview", href: "/vtu", icon: LayoutDashboard },
      { label: "VTU Updates", href: "/vtu/updates", icon: CalendarClock },
      { label: "Subject Notes", href: "/vtu/notes", icon: NotebookPen },
      { label: "Question Papers", href: "/vtu/question-papers", icon: FileText },
      { label: "Syllabus", href: "/vtu/syllabus", icon: ScrollText },
      { label: "Lab Manuals", href: "/vtu/lab-manuals", icon: BookMarked },
      { label: "Assignments", href: "/vtu/assignments", icon: ClipboardList },
      { label: "All Resources", href: "/vtu/resources", icon: FileStack },
      { label: "My Downloads", href: "/my-downloads", icon: Database },
    ],
  },
  placements: {
    id: "placements",
    label: "Placement Guides",
    items: [
      { label: "Overview", href: "/placements", icon: LayoutDashboard },
      { label: "DSA Sheets", href: "/placements/dsa-sheets", icon: SquareStack },
      { label: "DSA Patterns", href: "/placements/dsa-patterns", icon: Sparkles },
      { label: "Roadmaps", href: "/placements/roadmaps", icon: Route },
      { label: "DSA Playlists", href: "/placements/dsa-playlists", icon: Code2 },
      { label: "System Design", href: "/placements/system-design", icon: Database },
      { label: "SQL Sheet", href: "/placements/sql", icon: Database },
      {
        label: "Aptitude & Reasoning",
        href: "/placements/aptitude",
        icon: Percent,
      },
      {
        label: "Technical Subjects",
        href: "/placements/technical-subjects",
        icon: BookOpen,
      },
      {
        label: "Company Preparation",
        href: "/placements/company-preparation",
        icon: Building2,
      },
      { label: "Mock Tests", href: "/placements/mock-tests", icon: ListChecks },
      {
        label: "Interview Questions",
        href: "/placements/interview-questions",
        icon: MessagesSquare,
      },
    ],
  },
  jobs: {
    id: "jobs",
    label: "Jobs & Internships",
    items: [
      { label: "Overview", href: "/jobs", icon: LayoutDashboard },
      {
        label: "All Opportunities",
        href: "/jobs",
        icon: Briefcase,
      },
      { label: "Jobs", href: "/jobs?type=JOB", icon: Briefcase },
      { label: "Internships", href: "/jobs?type=INTERNSHIP", icon: GraduationCap },
      {
        label: "Off-Campus Drives",
        href: "/jobs?type=OFF_CAMPUS",
        icon: Flame,
      },
      { label: "Company Pages", href: "/jobs?view=companies", icon: Building2 },
      {
        label: "Submit Opportunity",
        href: "/jobs/submit",
        icon: Upload,
      },
      { label: "My Applications", href: "/jobs/applications", icon: ClipboardList },
      { label: "Saved Jobs", href: "/jobs/saved", icon: BookMarked },
    ],
  },
  dashboard: {
    id: "dashboard",
    label: "Student Dashboard",
    items: [
      { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
      { label: "Notifications", href: "/notifications", icon: Bell },
      { label: "My Progress", href: "/my-progress", icon: Radar },
      { label: "My Downloads", href: "/my-downloads", icon: Database },
      { label: "My Bookmarks", href: "/my-bookmarks", icon: BookMarked },
      { label: "My Tests", href: "/my-tests", icon: ListChecks },
      { label: "Test History", href: "/my-tests", icon: Trophy },
      { label: "Profile", href: "/profile", icon: Users },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
  admin: {
    id: "admin",
    label: "Admin Console",
    items: [
      { label: "Overview", href: "/admin", icon: LayoutDashboard },
      { label: "Content Management", href: "/admin/content", icon: FileStack },
      { label: "DSA Sheets", href: "/admin/dsa", icon: SquareStack },
      { label: "Roadmaps", href: "/admin/roadmaps", icon: Route },
      { label: "Playlists", href: "/admin/playlists", icon: Code2 },
      { label: "Patterns", href: "/admin/patterns", icon: Sparkles },
      { label: "Mock Tests", href: "/admin/mock-tests", icon: ListChecks },
      { label: "Opportunities", href: "/admin/jobs", icon: Briefcase },
      { label: "VTU Updates", href: "/admin/updates", icon: CalendarClock },
      { label: "Resources", href: "/admin/resources", icon: FileText },
      { label: "Students", href: "/admin/students", icon: Users },
      {
        label: "Bulk Content Import",
        href: "/admin/bulk-import",
        icon: Upload,
      },
      { label: "Automations", href: "/admin/automations", icon: Radar },
    ],
  },
};

export function sectionForPath(pathname: string): string {
  if (pathname.startsWith("/vtu")) return "vtu";
  if (pathname.startsWith("/placements")) return "placements";
  if (pathname.startsWith("/jobs")) return "jobs";
  if (pathname.startsWith("/admin")) return "admin";
  return "dashboard";
}
