"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ToolName } from "@/lib/const";
import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronLeft, GripVertical, X } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";

// Props for the base tool container
export interface ToolContainerProps {
  name: ToolName;
  title: string;
  children: ReactNode;
  headerContent?: ReactNode;
}

export function ToolContainer({
  name,
  title,
  children,
  headerContent,
}: ToolContainerProps) {
  // Local state for minimization
  const [isMinimized, setIsMinimized] = useState(false);
  // Hydration fix: State to track if client-side rendering is complete
  const [isMounted, setIsMounted] = useState(false);

  // Mount effect to handle hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Setup sortable functionality with all required attributes
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: name });

  // Apply styles from dnd-kit
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={isMounted ? style : undefined}
      className={cn(
        "overflow-hidden border shadow-sm transition-all",
        isMounted && isDragging ? "z-10 opacity-50" : "",
      )}
    >
      <CardHeader className="flex flex-row items-center space-x-2 border-b bg-background p-2">
        {/* Left side: Drag Handle and Title */}
        <div className="flex items-center space-x-2">
          {/* Drag Handle - with proper attributes and listeners */}
          <div className={cn("cursor-grab", !isMounted && "opacity-70")}>
            {isMounted ? (
              <div {...attributes} {...listeners}>
                <GripVertical className="h-4 w-4 text-muted-foreground/70" />
              </div>
            ) : (
              <GripVertical className="h-4 w-4 text-muted-foreground/70" />
            )}
          </div>

          {/* Title */}
          <span className="text-sm font-medium">{title}</span>
        </div>

        {/* Flexible space for right-aligned content */}
        <div className="flex-grow" />

        {/* Header Content (tabs, status, etc.) - now right-aligned */}
        {headerContent && <div className="mr-2">{headerContent}</div>}

        {/* Right side: Controls */}
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-6 w-6"
          >
            {isMinimized ? (
              <ChevronLeft className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>

      {/* Content Area (collapsible) */}
      {!isMinimized && <CardContent className="p-0">{children}</CardContent>}
    </Card>
  );
}
