"use client";

import { useEffect, useRef, useState } from "react";

export interface LogicalSelection {
  text: string;
  startIndex: number;
  endIndex: number;
}

export interface SelectionPosition {
  x: number;
  y: number;
}

interface UseTextSelectionOptions {
  enabled?: boolean;
  onSelection?: (selection: LogicalSelection, position: SelectionPosition) => void;
  direction?: "ltr" | "rtl";
}

function getLogicalOffset(container: HTMLElement, node: Node, offset: number): number {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
  let current: Node | null = walker.nextNode();
  let total = 0;

  while (current) {
    const textLength = current.textContent?.length ?? 0;
    if (current === node) {
      return total + offset;
    }
    total += textLength;
    current = walker.nextNode();
  }

  return total;
}

export function useTextSelection(options: UseTextSelectionOptions = {}) {
  const { enabled = true, onSelection, direction = "ltr" } = options;
  const [selection, setSelection] = useState<LogicalSelection | null>(null);
  const [position, setPosition] = useState<SelectionPosition>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleSelection = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || !containerRef.current) {
        setSelection(null);
        return;
      }

      const range = sel.getRangeAt(0);
      if (!containerRef.current.contains(range.commonAncestorContainer)) {
        setSelection(null);
        return;
      }

      const text = sel.toString();
      if (!text.trim()) {
        setSelection(null);
        return;
      }

      const startOffset = getLogicalOffset(containerRef.current, range.startContainer, range.startOffset);
      const endOffset = getLogicalOffset(containerRef.current, range.endContainer, range.endOffset);
      const logicalStart = Math.min(startOffset, endOffset);
      const logicalEnd = Math.max(startOffset, endOffset);

      const rect = range.getBoundingClientRect();
      const pos = {
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      };

      const logicalSelection: LogicalSelection = {
        text,
        startIndex: logicalStart,
        endIndex: logicalEnd,
      };

      setSelection(logicalSelection);
      setPosition(pos);
      onSelection?.(logicalSelection, pos);
    };

    const handleMouseUp = () => {
      // Delay slightly to allow selection to settle
      setTimeout(handleSelection, 80);
    };

    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSelection(null);
      }
    };

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("click", handleClick);
    };
  }, [enabled, onSelection, direction]);

  const clearSelection = () => {
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  };

  return {
    selection,
    position,
    clearSelection,
    containerRef,
  };
}

