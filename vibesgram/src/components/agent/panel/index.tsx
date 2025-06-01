"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAgentContext } from "../agent-context";
import { PanelContent } from "./panel-content";

// Panel Controls for displaying in toolbar
export function PanelControls() {
  const { panel } = useAgentContext();

  return (
    <>
      {/* Mobile Panel Button */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="md:hidden">
            Panel
          </Button>
        </DialogTrigger>
        <DialogContent className="h-[80vh] sm:max-w-[80%]">
          <DialogTitle className="sr-only">Panel</DialogTitle>
          <div className="h-full pt-6">
            <PanelContent />
          </div>
        </DialogContent>
      </Dialog>

      {/* Desktop Panel Button */}
      <Button
        variant="ghost"
        size="sm"
        className="hidden md:flex"
        onClick={panel.toggle}
      >
        {panel.isOpen ? "Hide Panel" : "Show Panel"}
      </Button>
    </>
  );
}

interface PanelProps {
  className?: string;
}

// Main panel component - only content without resizable controls
export function Panel({ className = "" }: PanelProps) {
  return (
    <div className={`relative h-full p-3 ${className}`}>
      <Card className="relative h-full">
        <PanelContent />
      </Card>
    </div>
  );
}
