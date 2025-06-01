"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useAgentContext } from "./agent-context";
import { ChatArea } from "./chat-area";
import { MessageInput } from "./chat-area/message-input";
import { Panel } from "./panel";
import { Toolbar } from "./toolbar";

interface AgentContainerProps {
  className?: string;
}

export function AgentContainer({ className = "" }: AgentContainerProps) {
  const { panel } = useAgentContext();

  return (
    <div className={`flex h-full flex-col ${className}`}>
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Main Content */}
        <ResizablePanel defaultSize={55} minSize={30}>
          <div className="flex h-full flex-col">
            {/* Chat Area */}
            <ChatArea />

            {/* Toolbar */}
            <Toolbar />

            {/* Input Box */}
            <MessageInput />
          </div>
        </ResizablePanel>

        {/* Desktop Panel - Resizable wrapper is here at the container level */}
        {panel.isOpen && (
          <>
            <ResizableHandle withHandle className="hidden md:flex" />
            <ResizablePanel
              defaultSize={45}
              minSize={20}
              className="hidden md:block"
            >
              <Panel />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
}
