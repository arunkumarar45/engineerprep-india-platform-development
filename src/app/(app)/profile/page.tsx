import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Student Profile",
  robots: { index: false, follow: false },
};
import { PageHeader } from "@/components/layout";
import { ProfileEditor } from "./ProfileEditor";
import { getSessionUser } from "@/lib/auth";
import { getBranches, getSemesters } from "@/lib/queries";

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/profile");

  const [branches, semesters] = await Promise.all([
    getBranches(),
    getSemesters(),
  ]);

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: "Student Dashboard", href: "/dashboard" }, { label: "Profile" }]}
        title="Student Profile"
        subtitle="Manage your personal details and academic information."
      />
      <ProfileEditor user={user} branches={branches} semesters={semesters} />
    </>
  );
}
