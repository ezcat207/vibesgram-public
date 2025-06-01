"use client";
import ColourfulText from "@/components/ui/colourful-text";
import { FileUploader } from "@/components/upload/file-uploader";
import { useToast } from "@/hooks/use-toast";
import { ArrowDown } from "lucide-react";

export function Hero() {
  const { toast } = useToast();

  // Function to scroll to content section when arrow is clicked
  const scrollToContent = () => {
    const contentSection = document.getElementById("content-section");
    if (contentSection) {
      contentSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative w-full bg-gradient-to-b from-transparent to-muted/20 py-4 md:py-6 lg:py-8">
      {/* Grid SVG background */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <img src="/grid.svg" alt="" className="h-full w-full object-cover" />
      </div>

      <div className="container relative z-10 px-4 md:px-6">
        <div className="flex flex-col items-center space-y-4">
          {/* Notification Banner */}
          <div className="flex w-full justify-center pb-8 pt-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/95 px-4 py-2 shadow-sm">
              <span className="text-xs sm:text-sm">
                ✨ Deploy your vibe code and get a shareable link, free no signup!  ✨
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl font-bold tracking-tighter text-foreground sm:text-3xl md:text-4xl lg:text-5xl">
              Share Your <ColourfulText text="Vibe Coding" /> with the World
            </h1>
            <p className="mx-auto flex max-w-[700px] items-center justify-center gap-2 text-base text-muted-foreground md:text-lg">
              <img
                src="/icon.png"
                alt="Vibesgram Logo"
                className="inline-block h-6 w-6 align-middle"
              />
              Vibesgram is vibe coder&apos;s digital gallery, a simple hosting service for everyone
            </p>
          </div>

          <div className="w-full max-w-3xl">
            <div className="rounded-lg bg-background/95 p-6 shadow-sm backdrop-blur-sm border border-primary/20">
              <FileUploader />
            </div>
          </div>
        </div>
      </div>

      {/* Clickable downward arrow */}
      <div className="mt-4 flex justify-center">
        <button
          onClick={scrollToContent}
          className="rounded-full p-2 transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/20"
          aria-label="Scroll to content"
        >
          <ArrowDown className="h-6 w-6 text-muted-foreground" />
        </button>
      </div>
    </section>
  );
}
