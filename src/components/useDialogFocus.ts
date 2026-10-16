"use client";

// Focus management for modal dialogs: move focus into the dialog when it
// opens, keep Tab / Shift+Tab inside it, and give focus back to whatever was
// focused before (usually the button that opened it) when it closes.

import { useEffect, type RefObject } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useDialogFocus(ref: RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const previous = document.activeElement as HTMLElement | null;
    const root = ref.current;
    const items = () =>
      root ? Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null) : [];
    // Prefer an explicit target, else the first form field, else the first control.
    const first =
      root?.querySelector<HTMLElement>("[data-autofocus]") ??
      root?.querySelector<HTMLElement>("input:not([type=hidden]), select, textarea") ??
      items()[0];
    first?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !root) return;
      const list = items();
      if (list.length === 0) return;
      const head = list[0];
      const tail = list[list.length - 1];
      if (e.shiftKey && (document.activeElement === head || !root.contains(document.activeElement))) {
        e.preventDefault();
        tail.focus();
      } else if (!e.shiftKey && (document.activeElement === tail || !root.contains(document.activeElement))) {
        e.preventDefault();
        head.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (previous && document.contains(previous)) previous.focus({ preventScroll: true });
    };
  }, [ref, active]);
}
