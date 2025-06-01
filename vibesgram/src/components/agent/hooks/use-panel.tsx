"use client";

import { useState } from "react";

/**
 * Panel state interface
 */
export interface PanelState {
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
}

/**
 * Hook for managing panel state
 * @param initialState - Optional initial open state (default: true)
 * @returns PanelState object with current state and methods
 */
export function usePanel(initialState = true): PanelState {
  const [isPanelOpen, setIsPanelOpen] = useState(initialState);

  const togglePanel = () => {
    setIsPanelOpen((prev) => !prev);
  };

  const openPanel = () => {
    if (!isPanelOpen) {
      setIsPanelOpen(true);
    }
  };

  const closePanel = () => {
    if (isPanelOpen) {
      setIsPanelOpen(false);
    }
  };

  return {
    isOpen: isPanelOpen,
    toggle: togglePanel,
    open: openPanel,
    close: closePanel,
  };
}
