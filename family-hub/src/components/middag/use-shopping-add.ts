"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { commitAddDraft } from "@/components/middag/add-draft";

export function useShoppingAdd(onAddItem: (name: string) => void) {
  const [adding, setAdding] = useState(false);
  const [draftItem, setDraftItem] = useState("");
  const [focusNonce, setFocusNonce] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    if (!adding) return;
    inputRef.current?.focus();
  }, [adding, focusNonce]);

  function saveItem() {
    const result = commitAddDraft(draftItem);
    if (result.kind === "close") {
      setAdding(false);
      setDraftItem("");
      return;
    }
    onAddItem(result.name);
    setDraftItem("");
    setFocusNonce((n) => n + 1);
  }

  function cancel() {
    setAdding(false);
    setDraftItem("");
  }

  function begin() {
    setAdding(true);
  }

  return { adding, draftItem, setDraftItem, inputRef, saveItem, cancel, begin };
}
