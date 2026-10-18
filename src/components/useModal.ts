"use client";

// Everything a modal needs, in one place: move focus into the dialog when it
// opens, keep Tab inside it, close on Escape, lock page scroll, and hand focus
// back to whatever opened it when it closes.

import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useModal(ref: RefObject<HTMLElement | null>, open: boolean, onClose: () => void) {
  // Parents usually pass an inline onClose; keep the latest without
  // re-running the effect (which would yank focus back on every render).
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const root = ref.current;
    const items = () =>
      root ? Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null) : [];
    (
      root?.querySelector<HTMLElement>("[data-autofocus]") ??
      root?.querySelector<HTMLElement>("input:not([type=hidden]), select, textarea") ??
      items()[0]
    )?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return close.current();
      if (e.key !== "Tab" || !root) return;
      const list = items();
      if (list.length === 0) return;
      const [head, tail] = [list[0], list[list.length - 1]];
      const outside = !root.contains(document.activeElement);
      if (e.shiftKey && (outside || document.activeElement === head)) {
        e.preventDefault();
        tail.focus();
      } else if (!e.shiftKey && (outside || document.activeElement === tail)) {
        e.preventDefault();
        head.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      if (previous && document.contains(previous)) previous.focus({ preventScroll: true });
    };
  }, [ref, open]);
}
