import { json, requireUser, route } from "@/lib/api/http";
import { listTracks } from "@/lib/services/learn";

export const GET = route(async () => json({ tracks: await listTracks(await requireUser()) }));
