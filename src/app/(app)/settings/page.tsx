import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout";
import { NotificationPreferences } from "./NotificationPreferences";
import { getSessionUser } from "@/lib/auth";
import { getPreference } from "@/lib/queries";

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/settings");

  const preference = await getPreference(user.id);

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: "Student Dashboard", href: "/dashboard" }, { label: "Settings" }]}
        title="Settings"
        subtitle="Control how EngineerPrep India notifies you about updates and deadlines."
      />
      <NotificationPreferences preference={preference} />
    </>
  );
}
