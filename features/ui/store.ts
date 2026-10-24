"use client";

import { create } from "zustand";
import { uid } from "@/lib/utils";

export interface Toast {
  id: string;
  message: string;
  variant: "default" | "success" | "error";
}

interface UiState {
  toasts: Toast[];
  cartOpen: boolean;
  menuOpen: boolean;
  addToast: (message: string, variant?: Toast["variant"]) => void;
  removeToast: (id: string) => void;
  setCartOpen: (open: boolean) => void;
  setMenuOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>()((set, get) => ({
  toasts: [],
  cartOpen: false,
  menuOpen: false,
  addToast: (message, variant = "default") => {
    const id = uid("toast");
    set({ toasts: [...get().toasts, { id, message, variant }] });
    if (typeof window !== "undefined") {
      window.setTimeout(() => get().removeToast(id), 3500);
    }
  },
  removeToast: (id) =>
    set({ toasts: get().toasts.filter((t) => t.id !== id) }),
  setCartOpen: (cartOpen) => set({ cartOpen }),
  setMenuOpen: (menuOpen) => set({ menuOpen }),
}));
