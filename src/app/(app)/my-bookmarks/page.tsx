import { redirect } from "next/navigation";
import Link from "next/link";
import { BookMarked, Bookmark } from "lucide-react";
import { PageHeader } from "@/components/layout";
import { Badge, Card, EmptyState } from "@/components/ui";
import { getBookmarks, getResources } from "@/lib/queries";
import { getSessionUser } from "@/lib/auth";

export default async function MyBookmarksPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/my-bookmarks");

  const [bookmarks, resources] = await Promise.all([
    getBookmarks(user.id),
    getResources(),
  ]);

  const resourceBookmarks = bookmarks.filter((b) => b.kind === "RESOURCE");
  const matched = resourceBookmarks
    .map((bookmark) => ({
      bookmark,
      resource: resources.find((r) => r.id === bookmark.refId),
    }))
    .filter((entry) => entry.resource);

  return (
    <>
      <PageHeader
        breadcrumb={[
          { label: "Student Dashboard", href: "/dashboard" },
          { label: "My Bookmarks" },
        ]}
        title="My Bookmarks"
        subtitle="VTU resources you saved for later."
        actions={
          <Badge tone="brand">
            <BookMarked className="size-3" /> {resourceBookmarks.length} saved
          </Badge>
        }
      />

      {matched.length === 0 ? (
        <EmptyState
          icon={<Bookmark className="size-6" />}
          title="No bookmarks yet"
          message="Use the bookmark icon on any VTU resource to save it here."
          action={
            <Link
              href="/vtu/resources"
              className="inline-flex h-9 items-center rounded-lg bg-brand-500 px-4 text-sm font-bold text-white hover:bg-brand-600"
            >
              Browse resources
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {matched.map(({ bookmark, resource }) => (
            <Card key={bookmark.id} hover className="p-4">
              <div className="flex items-start justify-between gap-2">
                <span className="grid size-9 place-items-center rounded-lg bg-brand-50 text-brand-500">
                  <BookMarked className="size-4" />
                </span>
                <Badge tone="neutral">{resource!.resourceType.replace("_", " ")}</Badge>
              </div>
              <h3 className="mt-3 line-clamp-2 text-sm font-bold text-ink-900">
                {resource!.title}
              </h3>
              <p className="mt-1 text-[0.68rem] text-ink-500">
                {resource!.subjectCode} · {resource!.subjectName}
              </p>
              <p className="mt-2 text-[0.68rem] text-ink-500">
                Saved {new Date(bookmark.createdAt).toLocaleDateString("en-IN")}
              </p>
              <a
                href={resource!.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3.5 inline-flex h-8 items-center rounded-lg bg-brand-50 px-3 text-xs font-bold text-brand-600 hover:bg-brand-100"
              >
                Open resource
              </a>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
