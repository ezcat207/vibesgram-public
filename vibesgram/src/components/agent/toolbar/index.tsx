"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { ListRestart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAgentContext } from "../agent-context";
import { PanelControls } from "../panel";

interface StatusData {
  status: string;
  message: string;
  progress: number;
}

interface ToolbarProps {
  className?: string;
}

export function Toolbar({ className = "" }: ToolbarProps) {
  const { chat } = useAgentContext();
  const router = useRouter();

  // Get the latest status from data stream
  const data = chat.data;
  const latestStatus = data?.[data.length - 1] as StatusData | undefined;

  const clearMessage = api.conversation.clearMessage.useMutation();

  return (
    <div
      className={`flex flex-col border-b border-t bg-muted/30 p-2 ${className}`}
    >
      {/* Status and Progress Bar */}
      {latestStatus && (
        <div className="mb-2">
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-blue-500 transition-all duration-500"
              style={{ width: `${latestStatus.progress ?? 0}%` }}
            ></div>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {latestStatus.message ?? latestStatus.status}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Clear conversation button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                title="Clear current conversation"
              >
                <ListRestart className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Clear</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to clear all messages in this
                  conversation? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    clearMessage.mutate({ id: chat.id });
                    router.refresh();
                  }}
                >
                  Clear
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Add more tool buttons here */}
        </div>

        <div className="flex items-center gap-2">
          <PanelControls />
        </div>
      </div>
    </div>
  );
}
