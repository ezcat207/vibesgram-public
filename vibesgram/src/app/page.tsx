"use client";

import { LatestArtifact } from "@/components/content/latest-artifact";
import { MainLayout } from "@/components/layout/main-layout";
import { FAQ } from "@/components/sections/faq";
import { Hero } from "@/components/sections/hero";

// Mock data for FAQ section
const FAQ_ITEMS = [
  {
    question: "What is Vibesgram?",
    answer:
      "Vibesgram is a digital gallery for coders to share their vibe coding projects, experiments, and tools with the world. It's a community platform for developers to showcase their work and get inspired by others.",
  },
  {
    question: "How do I upload my vibe coding project?",
    answer:
      "Click on the 'Upload Your Creation' button on the Vibesgram homepage, then follow the simple steps to upload your project files, add a title, description, and cover image. You can also add tags to help others discover your work.",
  },
  {
    question: "What kind of vibe coding projects can I share?",
    answer:
      "You can share any kind of project, from web applications, UI components, creative coding experiments, data visualizations, games, tools, libraries, and more. If you've coded it, you can share it here!",
  },
  {
    question: "Is Vibesgram free to use?",
    answer:
      "Yes, Vibesgram is free for basic use. We also offer premium features for power users who want additional storage, analytics, and customization options.",
  },
];

export default function Home() {
  return (
    <MainLayout>
      {/* Hero Section */}
      <Hero />

      {/* Latest Artifacts Section */}
      <LatestArtifact />

      {/* FAQ Section for SEO */}
      <FAQ
        title="Frequently Asked Questions"
        subtitle="Everything you need to know about Vibesgram"
        faqs={FAQ_ITEMS}
      />
    </MainLayout>
  );
}
