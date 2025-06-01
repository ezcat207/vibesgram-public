"use client";

import { ToolName } from "@/lib/const";
import { useState } from "react";

/**
 * Tool list state interface
 */
export interface ToolListState {
  // Current list of tool names
  tools: ToolName[];
  // Move a specific tool to the first position
  moveToolToFirst: (name: ToolName) => void;
  // Move tool from one position to another (for drag and drop)
  moveTool: (fromIndex: number, toIndex: number) => void;
  // Get index of a tool by name
  getToolIndex: (name: ToolName) => number;
}

// Default tools array
const defaultTools: ToolName[] = [
  ToolName.CODE_EDITOR,
  ToolName.PUBLISH,
];

/**
 * Hook for managing tool list state
 * @param initialTools - Optional initial tools (default: defaultTools)
 * @returns ToolListState object with current state and methods
 */
export function useToolList(initialTools = defaultTools): ToolListState {
  const [tools, setTools] = useState<ToolName[]>(initialTools);

  /**
   * Move a tool to the first position in the list
   */
  const moveToolToFirst = (name: ToolName) => {
    setTools((currentTools) => {
      const index = currentTools.findIndex((toolName) => toolName === name);
      if (index <= 0) return currentTools; // Already first or not found

      // Create a new array with the target tool first
      return [
        name,
        ...currentTools.slice(0, index),
        ...currentTools.slice(index + 1),
      ];
    });
  };

  /**
   * Move a tool from one position to another
   */
  const moveTool = (fromIndex: number, toIndex: number) => {
    setTools((currentTools) => {
      if (
        fromIndex < 0 ||
        fromIndex >= currentTools.length ||
        toIndex < 0 ||
        toIndex >= currentTools.length
      ) {
        return currentTools;
      }

      const newTools = [...currentTools];
      const movedTool = newTools.splice(fromIndex, 1)[0];
      if (movedTool) {
        newTools.splice(toIndex, 0, movedTool);
      }

      return newTools;
    });
  };

  /**
   * Get the index of a tool by its name
   */
  const getToolIndex = (name: ToolName): number => {
    return tools.findIndex((toolName) => toolName === name);
  };

  return {
    tools,
    moveToolToFirst,
    moveTool,
    getToolIndex,
  };
}
