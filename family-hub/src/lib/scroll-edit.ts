"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

const EDIT_TOP_GAP = 12;

export const EDIT_SCROLL_MARGIN_TOP = `calc(env(safe-area-inset-top, 0px) + ${EDIT_TOP_GAP}px)`;

export function scrollingAncestor(node: HTMLElement): HTMLElement {
  if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
    const main = document.querySelector<HTMLElement>(".shell-main");
    if (main) return main;
  }
  let parent = node.parentElement;
  while (parent && parent !== document.documentElement) {
    const overflow = getComputedStyle(parent).overflowY;
    if (/(auto|scroll)/.test(overflow) && parent.scrollHeight > parent.clientHeight + 1) {
      return parent;
    }
    parent = parent.parentElement;
  }
  const main = document.querySelector<HTMLElement>(".shell-main");
  if (main && main.scrollHeight > main.clientHeight + 1) return main;
  return document.documentElement;
}

function safeAreaInsetTop(): number {
  const probe = document.createElement("div");
  probe.setAttribute("aria-hidden", "true");
  probe.style.cssText =
    "position:fixed;inset:0 auto auto 0;height:env(safe-area-inset-top,0px);width:0;visibility:hidden;pointer-events:none";
  document.body.appendChild(probe);
  const height = probe.getBoundingClientRect().height;
  probe.remove();
  return height;
}

function stickyTopOffset(scroller: HTMLElement): number {
  const origin = scroller === document.documentElement || scroller === document.body ? 0 : scroller.getBoundingClientRect().top;
  const scope = scroller === document.documentElement ? document.body : scroller;
  let offset = 0;
  for (const el of scope.querySelectorAll<HTMLElement>("*")) {
    const position = getComputedStyle(el).position;
    if (position !== "sticky" && position !== "fixed") continue;
    const rect = el.getBoundingClientRect();
    if (rect.height <= 0 || rect.bottom <= origin) continue;
    if (rect.top <= origin + 1) offset = Math.max(offset, rect.bottom - origin);
  }
  return offset;
}

function isPhoneLayout(): boolean {
  return window.matchMedia("(max-width: 767px)").matches;
}

export function scrollEditCardToTop(node: HTMLElement) {
  if (!isPhoneLayout() || node.getClientRects().length === 0) return;
  const parent = scrollingAncestor(node);
  const parentTop = parent === document.documentElement || parent === document.body ? 0 : parent.getBoundingClientRect().top;
  const topPad = Math.max(safeAreaInsetTop(), stickyTopOffset(parent)) + EDIT_TOP_GAP;
  const delta = node.getBoundingClientRect().top - parentTop - topPad;
  if (Math.abs(delta) < 1) return;
  parent.scrollTop += delta;
}

export function useScrollEditIntoView(active: boolean) {
  const ref = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    if (!active) return;
    const node = ref.current;
    if (!node) return;
    const run = () => scrollEditCardToTop(node);
    run();
    const frame = window.requestAnimationFrame(run);
    return () => window.cancelAnimationFrame(frame);
  }, [active]);
  useEffect(() => {
    if (!active) return;
    const node = ref.current;
    if (!node) return;
    const frame = window.requestAnimationFrame(() => scrollEditCardToTop(node));
    return () => window.cancelAnimationFrame(frame);
  }, [active]);
  return ref;
}
