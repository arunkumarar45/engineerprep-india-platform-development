import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout";
import {
  Automations,
  BulkImport,
  ContentManagement,
  SimpleSection,
  Students,
} from "@/components/admin/sections";
import { VtuCollectorConsole } from "@/components/admin/VtuCollectorConsole";
import { getSessionUser } from "@/lib/auth";
import {
  getAllUsers,
  getAutomationExecutions,
  getAutomationRules,
  getContentForAdmin,
} from "@/lib/queries";
import { db } from "@/db";
import { importJobs } from "@/db/schema";
import { desc } from "drizzle-orm";

export default async function AdminSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "ADMIN") redirect("/dashboard");

  if (section === "bulk-import") {
    const imports = await db
      .select()
      .from(importJobs)
      .orderBy(desc(importJobs.createdAt));
    return (
      <>
        <PageHeader
          breadcrumb={[{ label: "Admin Console", href: "/admin" }, { label: "Bulk Content Import" }]}
          title="Bulk Content Import"
          subtitle="Upload and import DSA, questions, roadmaps, jobs and more using templates."
        />
        <BulkImport history={imports} />
      </>
    );
  }

  if (section === "automations") {
    const [rules, executions] = await Promise.all([
      getAutomationRules(),
      getAutomationExecutions(40),
    ]);
    return (
      <>
        <PageHeader
          breadcrumb={[{ label: "Admin Console", href: "/admin" }, { label: "Automations" }]}
          title="Automation Control Center"
          subtitle="Schedules, executions and manual triggers for every background job."
        />
        <Automations rules={rules} executions={executions} />
      </>
    );
  }

  if (section === "content") {
    const content = await getContentForAdmin();
    return (
      <>
        <PageHeader
          breadcrumb={[{ label: "Admin Console", href: "/admin" }, { label: "Content Management" }]}
          title="Content Management"
          subtitle="Create, edit, publish and delete platform content."
        />
        <ContentManagement content={content} />
      </>
    );
  }

  if (section === "students") {
    const students = await getAllUsers();
    return (
      <>
        <PageHeader
          breadcrumb={[{ label: "Admin Console", href: "/admin" }, { label: "Students" }]}
          title="Students"
          subtitle="Manage student accounts and platform access."
        />
        <Students students={students} />
      </>
    );
  }

  if (section === "vtu-collector" || section === "resources") {
    return (
      <>
        <PageHeader
          breadcrumb={[{ label: "Admin Console", href: "/admin" }, { label: "VTU Resource Collector" }]}
          title="VTU Academic Resource Collection & Verification System"
          subtitle="Discover, validate magic bytes, categorize and upload authentic VTU academic documents with zero interference with existing Notes."
        />
        <VtuCollectorConsole />
      </>
    );
  }

  if (
    ["dsa", "roadmaps", "playlists", "patterns", "mock-tests", "jobs", "updates"].includes(
      section,
    )
  ) {
    return (
      <>
        <PageHeader
          breadcrumb={[{ label: "Admin Console", href: "/admin" }, { label: section }]}
          title={section.replace("-", " ").replace(/^\w/, (c) => c.toUpperCase())}
          subtitle="Administrative tools for this content type."
        />
        <SimpleSection kind={section as never} />
      </>
    );
  }

  notFound();
}
