import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout";
import { getSessionUser } from "@/lib/auth";
import { getNotifications } from "@/lib/queries";
import type { NotificationItem } from "@/components/layout/Navbar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  const notifications: NotificationItem[] = user
    ? ((await getNotifications(user.id)) as NotificationItem[])
    : [];

  return (
    <AppShell user={user} notifications={notifications}>
      {children}
    </AppShell>
  );
}

export { redirect };
