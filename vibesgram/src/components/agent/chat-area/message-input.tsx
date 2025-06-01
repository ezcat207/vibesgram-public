"use client";

import { Button } from "@/components/ui/button";
import { ChatInput } from "@/components/ui/chat/chat-input";
import { type FormEvent, useRef } from "react";
import { useAgentContext } from "../agent-context";

interface MessageInputProps {
  className?: string;
}

export function MessageInput({ className = "" }: MessageInputProps) {
  const { chat } = useAgentContext();
  const { input, handleInputChange, handleSubmit } = chat;
  const formRef = useRef<HTMLFormElement>(null);

  // Custom submit handler with error handling
  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim()) {
      handleSubmit(e);
    }
  };

  // Handle keyboard shortcuts (Enter to send, Shift+Enter for new line)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && formRef.current) {
        formRef.current.requestSubmit();
      }
    }
  };

  return (
    <div className={`p-4 ${className}`}>
      <form
        ref={formRef}
        onSubmit={handleFormSubmit}
        className="flex items-center gap-2"
      >
        <ChatInput
          placeholder="Ask me anything..."
          className="flex-1"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
        />
        <Button
          type="submit"
          className="h-10 self-stretch bg-primary px-4"
          disabled={input.trim() === ""}
        >
          Send
        </Button>
      </form>
    </div>
  );
}
