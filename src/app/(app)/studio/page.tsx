import { redirect } from "next/navigation";

/** Storyline cases now live in Practice, under the Storylines tab. */
export default function StudioLandingPage() {
  redirect("/practice?tab=storylines");
}
