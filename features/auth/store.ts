"use client";

import { create } from "zustand";
import type { DemoUser, Role } from "@/types";
import { keyFor, readJson, writeJson } from "@/lib/storage";

/**
 * DEMO ONLY password. This is not a production credential — the admin area is
 * a client-side role simulation. Real authentication must be enforced on the
 * server (see docs/DEPLOYMENT.md).
 */
export const DEMO_ADMIN_PASSWORD = "admin123";

export const DEMO_USERS: DemoUser[] = [
  { id: "u-admin", name: "Demo Administrator", email: "admin@demo.test", role: "administrator", isDemo: true },
  { id: "u-super", name: "Demo Super Admin", email: "super@demo.test", role: "super_admin", isDemo: true },
  { id: "u-inv", name: "Demo Inventory Manager", email: "inventory@demo.test", role: "inventory_manager", isDemo: true },
  { id: "u-orders", name: "Demo Order Manager", email: "orders@demo.test", role: "order_manager", isDemo: true },
  { id: "u-acc", name: "Demo Accountant", email: "accountant@demo.test", role: "accountant", isDemo: true },
];

const AUTH_KEY = keyFor("admin_auth");

interface AuthState {
  user: DemoUser | null;
  authenticated: boolean;
  hydrated: boolean;
  hydrate: () => void;
  login: (role: Role, password: string) => boolean;
  switchRole: (role: Role) => void;
  logout: () => void;
}

function userForRole(role: Role): DemoUser {
  return DEMO_USERS.find((u) => u.role === role) ?? DEMO_USERS[0];
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  authenticated: false,
  hydrated: false,
  hydrate: () => {
    const saved = readJson<{ role?: Role }>(AUTH_KEY);
    if (saved?.role) {
      set({ user: userForRole(saved.role), authenticated: true, hydrated: true });
    } else {
      set({ hydrated: true });
    }
  },
  login: (role, password) => {
    if (password !== DEMO_ADMIN_PASSWORD) return false;
    const user = userForRole(role);
    writeJson(AUTH_KEY, { role: user.role });
    set({ user, authenticated: true });
    return true;
  },
  switchRole: (role) => {
    const user = userForRole(role);
    writeJson(AUTH_KEY, { role: user.role });
    set({ user });
  },
  logout: () => {
    writeJson(AUTH_KEY, null);
    set({ user: null, authenticated: false });
  },
}));

