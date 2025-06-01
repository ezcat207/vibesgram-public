"use client";

import { Card } from "@/components/ui/card";
import { type ToolInvocation } from "ai";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { useState } from "react";

interface FallbackToolCallProps {
  toolCall: ToolInvocation;
  className?: string;
}

export function FallbackToolCall({
  toolCall,
  className = "",
}: FallbackToolCallProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isInProgress = toolCall.state !== "result";

  return (
    <Card
      className={`mb-2 mt-2 w-full overflow-hidden border-border ${className}`}
    >
      {/* Tool header - always visible */}
      <div
        className="flex cursor-pointer items-center justify-between bg-muted px-3 py-2"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center">
          {isExpanded ? (
            <ChevronDown className="mr-2 h-4 w-4 flex-shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="mr-2 h-4 w-4 flex-shrink-0 text-muted-foreground" />
          )}
          <div className="truncate font-medium text-foreground">
            {toolCall.toolName}
          </div>
        </div>
        <div className="ml-2 flex flex-shrink-0 items-center gap-2 text-xs text-muted-foreground">
          {isInProgress && (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          )}
          {isInProgress ? "In Progress" : "Completed"}
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="w-full">
          {/* ID information */}
          <div className="border-t border-border bg-muted px-3 py-1.5">
            <div className="overflow-hidden text-ellipsis text-xs text-muted-foreground">
              Tool ID:{" "}
              <span className="break-all font-mono">{toolCall.toolCallId}</span>
            </div>
          </div>

          {/* Parameters information */}
          <div className="border-t border-border bg-background px-3 py-2">
            <div className="mb-1 text-sm font-medium text-foreground">
              Parameters
            </div>
            <pre className="max-h-32 overflow-auto whitespace-pre-wrap break-all rounded bg-muted p-2 text-xs text-foreground">
              {JSON.stringify(toolCall.args, null, 2)}
            </pre>
          </div>

          {/* Result information - only shown when state is result */}
          {toolCall.state === "result" && toolCall.result !== undefined && (
            <div className="border-t border-border bg-background px-3 py-2">
              <div className="mb-1 text-sm font-medium text-foreground">
                Result
              </div>
              <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all rounded bg-muted p-2 text-xs text-foreground">
                {typeof toolCall.result === "string"
                  ? toolCall.result
                  : JSON.stringify(toolCall.result, null, 2)}
              </pre>
            </div>
          )}

          {/* Progress indicator for in-progress tools */}
          {isInProgress && (
            <div className="flex items-center justify-center border-t border-border bg-background px-3 py-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing...</span>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
