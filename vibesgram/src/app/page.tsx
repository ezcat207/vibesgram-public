"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { Hero } from "@/components/sections/hero"; // Assuming Hero is generic or will be adapted
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { api } from "~/trpc/server"; // Server-side call for initial data
import { ProjectIdeaList } from "~/components/project/ProjectIdeaList";
import { FAQ } from "@/components/sections/faq"; // Keep FAQ if desired

// Mock data for FAQ section (can be moved or removed)
const FAQ_ITEMS = [
  { question: "What is this platform?", answer: "A place to fund and build cool project ideas!" },
  { question: "How do I submit an idea?", answer: "Click 'Publish Your Idea' and fill out the form." },
  { question: "How can I support a project?", answer: "You can pledge to projects that are crowdfunding." },
  { question: "How do I apply to develop a project?", answer: "Funded projects will show an option to apply for developers." },
];


export default async function Home() {
  // Fetch data for different sections.
  // For "Hot Projects", we'll use recently funded or highly pledged ones if possible.
  // Current `getAll` sorts by `createdAt`. We might need to adjust or add specific queries later for "hotness".
  // For now, "Hot" could be recently FUNDED, or just a slice of CROWDFUNDING.

  const latestProjectsData = await api.projectIdea.getAll.query({ limit: 6 /*, status: "CROWDFUNDING" */ });
  // To strictly show only CROWDFUNDING, a filter by status would be needed in `getAll` or a new procedure.
  // For now, it fetches all, and client can visually filter or we assume most recent are crowdfunding.

  const hotProjectsData = await api.projectIdea.getAll.query({ limit: 3 /*, status: "FUNDED" or sort by pledges */});
  // This is a placeholder for "hot". True hotness needs better metrics. Using recent FUNDED as a proxy.
  const hotProjects = hotProjectsData.items.filter(p => p.status === "FUNDED").slice(0,3);
  // If no funded, show some crowdfunding ones
   const hotProjectsFallback = hotProjects.length === 0 ? latestProjectsData.items.filter(p=>p.status === "CROWDFUNDING").slice(0,3) : [];


  const successfulCasesData = await api.projectIdea.getAll.query({ limit: 3 /*, status: "COMPLETED" */ });
  const successfulCases = successfulCasesData.items.filter(p => p.status === "COMPLETED").slice(0,3);


  return (
    <MainLayout>
      <Hero
        title="Turn Ideas into Reality, Together."
        subtitle="Discover, fund, and build innovative projects. Or, bring your own vision to life."
        actions={
          <Link href="/submit-idea" passHref>
            <Button size="lg" className="mt-4">
              Publish Your Idea
            </Button>
          </Link>
        }
      />

      <div className="py-6 text-center">
        {/* This button is an alternative or addition to the one in Hero */}
        <Link href="/submit-idea" passHref>
          <Button size="lg" variant="outline" className="mx-auto">
            Got an Idea? Let&apos;s Build It!
          </Button>
        </Link>
      </div>

      <ProjectIdeaList
        title="Hot Projects 🔥"
        projects={hotProjects.length > 0 ? hotProjects : hotProjectsFallback}
        emptyStateMessage="No funded projects yet. Be the first to back an idea!"
      />

      <ProjectIdeaList
        title="Latest Ideas Seeking Funding 🚀"
        projects={latestProjectsData.items.filter(p => p.status === "CROWDFUNDING")}
        emptyStateMessage="No new ideas seeking funding right now. Check back soon!"
      />

      <ProjectIdeaList
        title="Successful Cases ✅"
        projects={successfulCases}
        emptyStateMessage="No projects completed yet. Let's make history!"
      />

      <FAQ
        title="Frequently Asked Questions"
        subtitle="Your questions, answered."
        faqs={FAQ_ITEMS}
      />
    </MainLayout>
  );
}
