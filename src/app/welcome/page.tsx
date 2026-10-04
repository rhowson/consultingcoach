import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { Assessments } from "@/components/marketing/assessments";
import { FinalCta, SiteFooter } from "@/components/marketing/closing";
import { Comparison } from "@/components/marketing/comparison";
import { Features } from "@/components/marketing/features";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { PracticeStrip } from "@/components/marketing/practice-strip";
import { Pricing } from "@/components/marketing/pricing";
import { ProgressSection } from "@/components/marketing/progress-section";
import { SiteNav } from "@/components/marketing/site-nav";

export const metadata: Metadata = {
  title: "Consulting Coach — AI coaching for consultants",
  description:
    "Practise difficult client conversations, storylines and SteerCo delivery with an AI coach that scores you against your target level, from Analyst to Director.",
};

export default async function WelcomePage() {
  const signedIn = !!(await getCurrentUser());
  const primaryHref = signedIn ? "/" : "/signup";
  const primaryLabel = signedIn ? "Go to app" : "Start free";

  return (
    <div className="overflow-x-clip bg-bg">
      <SiteNav signedIn={signedIn} />
      <main>
        <Hero primaryHref={primaryHref} primaryLabel={primaryLabel} />
        <PracticeStrip />
        <Features ctaHref={primaryHref} />
        <HowItWorks />
        <Comparison />
        <ProgressSection />
        <Assessments />
        <Pricing />
        <FinalCta primaryHref={primaryHref} primaryLabel={primaryLabel} signedIn={signedIn} />
      </main>
      <SiteFooter />
    </div>
  );
}
