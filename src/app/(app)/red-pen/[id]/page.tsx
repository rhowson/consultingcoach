import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requirePageUser } from "@/lib/page-auth";
import { getReview } from "@/lib/services/redpen";
import { HttpError } from "@/lib/api/http";
import { ReviewView } from "@/components/red-pen/review-view";

export default async function RedPenReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePageUser();
  const { id } = await params;
  // Review ids are UUIDs; anything else would fail in Postgres rather than return nothing.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();
  let review;
  try {
    review = await getReview(user, id);
  } catch (e) {
    if (e instanceof HttpError && e.code === "not_found") notFound();
    throw e;
  }
  return (
    <div className="flex flex-col gap-6">
      <Link href="/red-pen" className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-primary no-underline hover:underline">
        <ArrowLeft size={16} aria-hidden />
        All reviews
      </Link>
      <ReviewView
        review={{
          id: review.id,
          title: review.title,
          content: review.content,
          deliverableType: review.deliverableType,
          targetLevel: review.targetLevel,
          createdAt: review.createdAt.toISOString(),
          result: review.result,
        }}
      />
    </div>
  );
}
