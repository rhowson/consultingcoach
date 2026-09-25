import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requirePageUser } from "@/lib/page-auth";
import { getLesson } from "@/lib/services/learn";
import { HttpError } from "@/lib/api/http";
import { LessonView } from "@/components/learn/lesson-view";

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePageUser();
  const { id } = await params;
  let lesson;
  try {
    lesson = await getLesson(user, id);
  } catch (e) {
    if (e instanceof HttpError && e.code === "not_found") notFound();
    throw e;
  }
  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6">
      <Link href="/learn" className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-primary no-underline hover:underline">
        <ArrowLeft size={16} aria-hidden />
        All tracks
      </Link>
      <LessonView
        lesson={{
          id: lesson.id,
          title: lesson.title,
          level: lesson.level,
          durationMin: lesson.durationMin,
          blocks: lesson.blocks,
          completed: lesson.completed,
          quizScore: lesson.quizScore,
          practice: lesson.practice,
        }}
      />
    </div>
  );
}
