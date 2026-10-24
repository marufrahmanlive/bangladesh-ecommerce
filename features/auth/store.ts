"use client";

import { create } from "zustand";
import type { DemoUser, Role } from "@/types";

interface AuthState {
  user: DemoUser | null;
  login: (role: Role) => void;
  logout: () => void;
}

export const DEMO_USERS: DemoUser[] = [
  { id: "u-admin", name: "Demo Administrator", email: "admin@demo.test", role: "administrator", isDemo: true },
  { id: "u-super", name: "Demo Super Admin", email: "super@demo.test", role: "super_admin", isDemo: true },
  { id: "u-inv", name: "Demo Inventory Manager", email: "inventory@demo.test", role: "inventory_manager", isDemo: true },
  { id: "u-orders", name: "Demo Order Manager", email: "orders@demo.test", role: "order_manager", isDemo: true },
  { id: "u-acc", name: "Demo Accountant", email: "accountant@demo.test", role: "accountant", isDemo: true },
];

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  login: (role) => {
    const user = DEMO_USERS.find((u) => u.role === role) ?? DEMO_USERS[0];
    set({ user });
  },
  logout: () => set({ user: null }),
}));
