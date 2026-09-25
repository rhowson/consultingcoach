import { requirePageUser } from "@/lib/page-auth";
import { listTracks } from "@/lib/services/learn";
import { TrackList } from "@/components/learn/track-list";

export const metadata = { title: "Learn · Consulting Coach" };

export default async function LearnPage() {
  const user = await requirePageUser();
  const tracks = await listTracks(user);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex max-w-[640px] flex-col gap-1">
        <p className="m-0 text-ink-2">
          Short, practical lessons on the craft. Each one ends with a rep so you put it to work straight away.
        </p>
      </div>
      <TrackList tracks={tracks} />
    </div>
  );
}
