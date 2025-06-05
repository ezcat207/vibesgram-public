"use client";

import { LatestArtifact } from "@/components/content/latest-artifact";
import { MainLayout } from "@/components/layout/main-layout";
import { FAQ } from "@/components/sections/faq";
import { Hero } from "@/components/sections/hero";

// Mock data for FAQ section
const FAQ_ITEMS = [
  {
    question: "What is Binbody?",
    answer:
      "Binbody is a platform for Vibe Coding creators to get their projects crowdfunded. We focus on high-quality, innovative ideas, helping to amplify signal and reduce noise in the creative coding space.",
  },
  {
    question: "How do I submit a Vibe Coding project for funding on Binbody?",
    answer:
      "To submit a project, navigate to the 'Submit Project' section on Binbody. You'll need to provide details about your Vibe Coding concept, funding goals, and how it contributes to a high signal-to-noise ecosystem. Clear, concise proposals that emphasize quality and innovation are encouraged.",
  },
  {
    question: "What kind of Vibe Coding projects can I fund or get funded on Binbody?",
    answer:
      "Binbody supports a wide range of Vibe Coding projects, including innovative web applications, unique UI components, creative coding experiments, insightful data visualizations, indie games, developer tools, and libraries. We prioritize projects that aim for high quality and offer a strong signal over fleeting trends.",
  },
  {
    question: "How does funding work on Binbody? Are there fees?",
    answer:
      "Creators can list their Vibe Coding projects for crowdfunding on Binbody. Backers can support projects they believe in. Binbody takes a small platform fee from successfully funded projects to help maintain and grow the ecosystem. Listing a project is free.",
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
        subtitle="Everything you need to know about Binbody and our Vibe Coding crowdfunding philosophy."
        faqs={FAQ_ITEMS}
      />
    </MainLayout>
  );
}
