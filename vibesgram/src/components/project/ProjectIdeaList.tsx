"use client";

import { ProjectIdeaCard, type ProjectIdeaCardProps } from "./ProjectIdeaCard";

interface ProjectIdeaListProps {
  title: string;
  projects: ProjectIdeaCardProps[] | undefined; // Allow undefined for loading/error states
  isLoading?: boolean;
  error?: string | null;
  emptyStateMessage?: string;
}

export function ProjectIdeaList({
  title,
  projects,
  isLoading,
  error,
  emptyStateMessage = "No projects found in this category yet."
}: ProjectIdeaListProps) {
  if (isLoading) {
    return (
      <section className="py-8">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">{title}</h2>
          <p className="text-center">Loading projects...</p>
          {/* Optional: Add skeleton loaders here */}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-8">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">{title}</h2>
          <p className="text-center text-red-500">Error loading projects: {error}</p>
        </div>
      </section>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <section className="py-8">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">{title}</h2>
          <p className="text-center text-gray-600">{emptyStateMessage}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 bg-slate-50 dark:bg-slate-800">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-10 text-center text-slate-800 dark:text-slate-100">{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <ProjectIdeaCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
}
