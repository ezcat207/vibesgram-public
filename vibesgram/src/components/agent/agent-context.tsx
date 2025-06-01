"use client";

import { useToast } from "@/hooks/use-toast";
import { MAX_STEPS, ToolName } from "@/lib/const";
import { useChat } from "@ai-sdk/react";
import { type Message } from "ai";
import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useEditor, type EditorState } from "./hooks/use-editor";
import { usePanel, type PanelState } from "./hooks/use-panel";
import { useToolList, type ToolListState } from "./hooks/use-toollist";

// Definition of the entire Context interface
interface AgentContextType {
  panel: PanelState;
  editor: EditorState;
  chat: ReturnType<typeof useChat>;
  toolList: ToolListState;
  // Future possible additions
  // artifacts: ArtifactState;
  // etc.
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

interface AgentProviderProps {
  children: ReactNode;
  initialMessages?: Message[];
  chatId: string; // Make chatId required
}

export function AgentProvider({
  children,
  initialMessages,
  chatId,
}: AgentProviderProps) {
  const { toast } = useToast();

  // Panel state - now using the dedicated hook
  const panelState = usePanel(true);

  // Editor state - initialize with default template
  const editorState = useEditor("");

  // Tool list state - using the new hook
  const toolListState = useToolList();

  // Helper function to handle code editor updates in a consistent way
  const handleCodeEditorUpdate = (content: string) => {
    editorState.setContent(content);
    editorState.setActiveTab("preview");
    return {};
  };

  // Chat state - using the full useChat return value
  const chatState = useChat({
    api: `/api/agent/${chatId}`, // Always use the ID-based API route
    id: chatId,
    initialMessages,
    maxSteps: MAX_STEPS,
    onError: (error) => {
      console.error("Agent API error:", error);
      toast({
        variant: "destructive",
        title: "Agent API error",
        description: `Check console for details, or contact support`,
      });
    },
    onToolCall: async ({ toolCall }) => {
      // Move the tool to first position when it's called
      if (toolCall.toolName === String(ToolName.CODE_EDITOR)) {
        toolListState.moveToolToFirst(ToolName.CODE_EDITOR);

        // Handle code editor update
        const args = toolCall.args as { content: string };
        return handleCodeEditorUpdate(args.content);
      }
    },
  });

  // Debug functionality - log messages when they change in development environment
  const { messages, addToolResult } = chatState;

  // Use React's useEffect to watch for changes in messages
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("DEBUG: Messages changed:", messages);
    }
  }, [messages]);

  // Fix all initial tool calls and replay editor operations for initialization
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("DEBUG: Messages:", messages);
    }
    if (!initialMessages) return;

    // Replay editor operations from history
    let lastContent = "";

    // Process messages to find the last editor content update
    initialMessages.forEach((message) => {
      if (!message.parts) return;

      message.parts.forEach((part) => {
        if (
          part.type === "tool-invocation" &&
          part.toolInvocation.toolName === String(ToolName.CODE_EDITOR) &&
          part.toolInvocation.args
        ) {
          const args = part.toolInvocation.args as { content: string };
          if (args.content) {
            lastContent = args.content;
          }
        }

        // Fix missing tool results
        if (
          part.type === "tool-invocation" &&
          part.toolInvocation.state !== "result"
        ) {
          addToolResult({
            toolCallId: part.toolInvocation.toolCallId,
            result: {},
          });
        }
      });
    });

    // Apply the last content from history if found
    if (lastContent) {
      // Use false to not automatically switch to preview tab during initialization
      handleCodeEditorUpdate(lastContent);
    }

    // only run on initial mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Organize values by domain
  const value: AgentContextType = {
    panel: panelState,
    editor: editorState,
    chat: chatState,
    toolList: toolListState,
    // Future possible additions
    // artifacts: { ... },
  };

  return (
    <AgentContext.Provider value={value}>{children}</AgentContext.Provider>
  );
}

export function useAgentContext() {
  const context = useContext(AgentContext);
  if (context === undefined) {
    throw new Error("useAgentContext must be used within an AgentProvider");
  }
  return context;
}
