"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, X } from "lucide-react";
import type { Category } from "@/types";
import { useI18n } from "@/features/i18n";
import { useCatalog } from "@/features/catalog/store";
import { useUiStore } from "@/features/ui/store";
import { t } from "@/lib/slug";
import { getChildren } from "@/services/catalog";
import { LanguageSwitcher } from "./language-switcher";
import { Button } from "@/components/ui/button";

function RecursiveMenu({
  categories,
  parentId,
  locale,
  onNavigate,
  expanded,
  onToggle,
  depth = 0,
}: {
  categories: Category[];
  parentId: string | null;
  locale: "en" | "bn";
  onNavigate: () => void;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  depth?: number;
}) {
  return (
    <>
      {getChildren(categories, parentId).map((cat) => {
        const children = getChildren(categories, cat.id);
        return (
          <div key={cat.id}>
            <div
              className="flex items-center justify-between"
              style={{ paddingLeft: depth * 12 }}
            >
              <Link
                href={`/categories/${cat.slug}`}
                onClick={onNavigate}
                className="flex-1 py-2 text-sm"
              >
                {t(locale, cat.name)}
              </Link>
              {children.length > 0 && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => onToggle(cat.id)}
                  aria-label="toggle"
                >
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${expanded.has(cat.id) ? "rotate-180" : ""}`}
                  />
                </Button>
              )}
            </div>
            {children.length > 0 && expanded.has(cat.id) && (
              <RecursiveMenu
                categories={categories}
                parentId={cat.id}
                locale={locale}
                onNavigate={onNavigate}
                expanded={expanded}
                onToggle={onToggle}
                depth={depth + 1}
              />
            )}
          </div>
        );
      })}
    </>
  );
}

export function MobileMenu() {
  const { locale, t: tr } = useI18n();
  const { categories } = useCatalog();
  const open = useUiStore((s) => s.menuOpen);
  const setOpen = useUiStore((s) => s.setMenuOpen);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <>
      <div
        className={open ? "fixed inset-0 z-40 bg-black/50" : "hidden"}
        onClick={() => setOpen(false)}
      />
      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-80 max-w-[85vw] flex-col bg-background transition-transform ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b p-4">
          <span className="font-semibold">{tr("nav.menu")}</span>
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="close">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <Link href="/" onClick={() => setOpen(false)} className="block py-2 text-sm font-medium">
            {tr("nav.home")}
          </Link>
          <div className="py-2 text-xs font-semibold uppercase text-muted-foreground">
            {tr("nav.categories")}
          </div>
          <RecursiveMenu
            categories={categories}
            parentId={null}
            locale={locale}
            onNavigate={() => setOpen(false)}
            expanded={expanded}
            onToggle={toggle}
          />
          <div className="mt-2 border-t pt-2">
            <Link href="/orders/track" onClick={() => setOpen(false)} className="block py-2 text-sm">
              {tr("order.track")}
            </Link>
            <Link href="/wishlist" onClick={() => setOpen(false)} className="block py-2 text-sm">
              {tr("nav.wishlist")}
            </Link>
            <Link href="/about" onClick={() => setOpen(false)} className="block py-2 text-sm">
              {tr("nav.about")}
            </Link>
            <Link href="/contact" onClick={() => setOpen(false)} className="block py-2 text-sm">
              {tr("nav.contact")}
            </Link>
          </div>
          <div className="mt-4">
            <LanguageSwitcher />
          </div>
        </div>
      </aside>
    </>
  );
}
