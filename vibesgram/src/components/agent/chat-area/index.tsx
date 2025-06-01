"use client";

import {
  ChatBubble,
  ChatBubbleMessage,
  ChatBubbleTimestamp,
} from "@/components/ui/chat/chat-bubble";
import { ChatMessageList } from "@/components/ui/chat/chat-message-list";
import MessageLoading from "@/components/ui/chat/message-loading";
import { type Message } from "ai";
import { useEffect, useRef } from "react";
import { useAgentContext } from "../agent-context";
import { FallbackToolCall } from "./tool-call-renderer";

interface ChatAreaProps {
  className?: string;
}

export function ChatArea({ className = "" }: ChatAreaProps) {
  const { chat } = useAgentContext();
  const { messages, status } = chat;

  const messageListRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Unified message renderer
  const renderMessage = (message: Message) => {
    const variant = message.role === "user" ? "sent" : "received";

    // Simple message with no parts
    if (!message.parts || !Array.isArray(message.parts)) {
      return (
        <ChatBubbleMessage variant={variant}>
          {message.content}
        </ChatBubbleMessage>
      );
    }

    // Message with parts (text and/or tool calls)
    const messageParts: React.ReactNode[] = [];

    // Process each part in the original order
    message.parts.forEach((part, index) => {
      if (part.type === "text") {
        messageParts.push(
          <div key={`text-${index}`} className="mb-2">
            {part.text}
          </div>,
        );
      } else if (part.type === "tool-invocation" && part.toolInvocation) {
        // Always render tool calls, whether in progress or completed
        messageParts.push(
          <FallbackToolCall
            key={`tool-${part.toolInvocation.toolCallId}`}
            toolCall={part.toolInvocation}
          />,
        );
      }
    });

    // If no renderable parts, fallback to message content
    if (messageParts.length === 0) {
      return (
        <ChatBubbleMessage variant={variant}>
          {message.content}
        </ChatBubbleMessage>
      );
    }

    // Return parts in original order
    return (
      <ChatBubbleMessage variant={variant}>{messageParts}</ChatBubbleMessage>
    );
  };

  // Check if AI is currently generating a response
  const isGenerating = status === "streaming";

  return (
    <div className={`relative flex-1 overflow-hidden ${className}`}>
      <div className="scrollbar-thumb-rounded-full absolute inset-0 overflow-y-auto overscroll-none scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/50 hover:scrollbar-thumb-muted-foreground/70">
        <ChatMessageList ref={messageListRef} className="h-auto min-h-full">
          {messages.map((message, index) => (
            <ChatBubble
              key={message.id || `message-${index}`}
              variant={message.role === "user" ? "sent" : "received"}
            >
              <div>
                {renderMessage(message)}
                <div className="flex items-center justify-between">
                  <ChatBubbleTimestamp
                    timestamp={new Date().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  />
                  {/* Show loading animation for the last assistant message when generating */}
                  {isGenerating &&
                    index === messages.length - 1 &&
                    message.role === "assistant" && (
                      <div className="ml-2 flex animate-pulse items-center">
                        <MessageLoading />
                      </div>
                    )}
                </div>
              </div>
            </ChatBubble>
          ))}
        </ChatMessageList>
      </div>
    </div>
  );
}
