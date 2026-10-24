"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Boxes,
  Calculator,
  ClipboardList,
  CreditCard,
  FileText,
  FolderTree,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  Package,
  Receipt,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Star,
  Ticket,
  Truck,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useI18n } from "@/features/i18n";
import { useAuthStore, DEMO_USERS, DEMO_ADMIN_PASSWORD } from "@/features/auth/store";
import type { Role } from "@/types";
import { LanguageSwitcher } from "@/components/storefront/language-switcher";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV: NavItem[] = [
  { href: "/admin", label: "admin.dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "admin.products", icon: Package },
  { href: "/admin/categories", label: "admin.categories", icon: FolderTree },
  { href: "/admin/inventory", label: "admin.inventory", icon: Boxes },
  { href: "/admin/orders", label: "admin.orders", icon: ShoppingCart },
  { href: "/admin/customers", label: "admin.customers", icon: Users },
  { href: "/admin/suppliers", label: "admin.suppliers", icon: Truck },
  { href: "/admin/purchases", label: "admin.purchases", icon: ClipboardList },
  { href: "/admin/coupons", label: "admin.coupons", icon: Ticket },
  { href: "/admin/reviews", label: "admin.reviews", icon: Star },
  { href: "/admin/expenses", label: "admin.expenses", icon: Receipt },
  { href: "/admin/payments", label: "admin.payments", icon: CreditCard },
  { href: "/admin/invoices", label: "admin.invoices", icon: FileText },
  { href: "/admin/ledger", label: "admin.ledger", icon: BookOpen },
  { href: "/admin/accounting", label: "admin.accounting", icon: Calculator },
  { href: "/admin/reports", label: "admin.reports", icon: BarChart3 },
  { href: "/admin/settings", label: "admin.settings", icon: Settings },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const authenticated = useAuthStore((s) => s.authenticated);
  const hydrated = useAuthStore((s) => s.hydrated);
  const logout = useAuthStore((s) => s.logout);
  const switchRole = useAuthStore((s) => s.switchRole);
  const [menuOpen, setMenuOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("administrator");
  const [error, setError] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!useAuthStore.getState().login(role, password)) setError(true);
  };

  if (!hydrated) return <div className="min-h-screen" />;

  if (!authenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4">
        <div className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-sm">
          <div className="mb-6 text-center">
            <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
            <h1 className="mt-2 text-xl font-bold">Admin Login</h1>
            <p className="mt-1 text-xs text-muted-foreground">{t("admin.demoLoginNotice")}</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <Label htmlFor="role" className="mb-1 block">Role</Label>
              <Select id="role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
                {DEMO_USERS.map((u) => (
                  <option key={u.id} value={u.role}>{u.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="password" className="mb-1 block">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              {error && <p className="mt-1 text-xs text-destructive">Incorrect password</p>}
            </div>
            <Button type="submit" className="w-full">
              <Lock className="h-4 w-4" /> Sign in
            </Button>
          </form>
          <p className="mt-4 rounded-md bg-accent p-2 text-center text-xs text-muted-foreground">
            Demo password: <span className="font-mono font-semibold">{DEMO_ADMIN_PASSWORD}</span>
          </p>
          <Link href="/" className="mt-3 block text-center text-sm text-primary hover:underline">
            ← Back to store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="bg-warning/15 px-4 py-2 text-center text-xs text-warning">
        {t("admin.demoLoginNotice")}
      </div>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-64 shrink-0 overflow-auto border-r bg-background p-3 transition-transform lg:static lg:translate-x-0",
            menuOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="mb-4 flex items-center justify-between px-2">
            <Link href="/admin" className="text-lg font-bold text-primary">
              BanglaBazar Admin
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMenuOpen(false)}
              aria-label="close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="mb-3 rounded-md border p-3">
            <label className="mb-1 block text-xs font-medium">{t("admin.overview")}</label>
            <Select
              value={user?.role ?? ""}
              onChange={(e) => switchRole(e.target.value as Role)}
            >
              {DEMO_USERS.map((u) => (
                <option key={u.id} value={u.role}>
                  {u.name}
                </option>
              ))}
            </Select>
            {user && (
              <p className="mt-1 text-xs text-muted-foreground">
                {user.name} ({user.role})
              </p>
            )}
          </div>

          <nav className="space-y-1">
            {NAV.map((item) => {
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {t(item.label)}
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 border-t pt-4">
            <button
              onClick={() => {
                logout();
                router.push("/");
              }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
            >
              <LogOut className="h-4 w-4" />
              {t("admin.logout")}
            </button>
            <div className="mt-2 px-3">
              <LanguageSwitcher />
            </div>
          </div>
        </aside>

        {menuOpen && (
          <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setMenuOpen(false)} />
        )}

        <div className="flex-1">
          <div className="flex items-center gap-3 border-b p-3 lg:hidden">
            <Button variant="outline" size="icon" onClick={() => setMenuOpen(true)} aria-label="menu">
              <Menu className="h-4 w-4" />
            </Button>
            <span className="font-semibold">Admin</span>
          </div>
          <main className="p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
