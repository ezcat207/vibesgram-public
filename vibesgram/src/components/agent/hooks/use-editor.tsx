"use client";

import { useState } from "react";

/**
 * Editor state interface
 */
export interface EditorState {
  // Current content of the editor
  content: string;
  // Method to update the content
  setContent: (content: string) => void;
  // Clear the editor content
  clearContent: () => void;
  // Check if editor has content
  hasContent: boolean;
  // Active tab in the editor (code or preview)
  activeTab: "code" | "preview";
  // Set the active tab
  setActiveTab: (tab: "code" | "preview") => void;
}

/**
 * Hook for managing editor state
 * @param initialContent - Optional initial content (default: empty string)
 * @returns EditorState object with current state and methods
 */
export function useEditor(initialContent = ""): EditorState {
  const [content, setContent] = useState<string>(initialContent);
  const [activeTab, setActiveTab] = useState<"code" | "preview">("code");

  const clearContent = () => {
    setContent("");
  };

  // Computed property to check if editor has content
  const hasContent = content.trim().length > 0;

  return {
    content,
    setContent,
    clearContent,
    hasContent,
    activeTab,
    setActiveTab,
  };
}
