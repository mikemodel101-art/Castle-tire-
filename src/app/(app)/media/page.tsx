import { MediaLibrary } from "@/components/media-library";
import { PageHeader } from "@/components/ui";
import { CATEGORIES, MEDIA, type Category } from "@/lib/data";

export const metadata = { title: "Photos & video" };

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<{ job?: string; category?: string }>;
}) {
  const sp = await searchParams;
  const validCategory = CATEGORIES.some((c) => c.id === sp.category);
  const initialCategory: Category | "all" = validCategory ? (sp.category as Category) : "all";
  const initialJob = sp.job ?? "";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Photos & videos"
        title="Vehicle media library"
        subtitle="Every photo and short video is saved to the vehicle's history, grouped by inspection category."
      />
      <MediaLibrary initialMedia={MEDIA} initialCategory={initialCategory} initialJob={initialJob} />
    </div>
  );
}
