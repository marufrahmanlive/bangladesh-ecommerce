"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Menu, Search, ShoppingCart, User } from "lucide-react";
import { useI18n } from "@/features/i18n";
import { useCatalog } from "@/features/catalog/store";
import { useCartCount } from "@/features/cart/store";
import { useWishlistStore } from "@/features/wishlist/store";
import { useUiStore } from "@/features/ui/store";
import { LanguageSwitcher } from "./language-switcher";
import { CategoryNav } from "./category-nav";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";

export function Header() {
  const { t } = useI18n();
  const router = useRouter();
  const { categories, ready } = useCatalog();
  const cartCount = useCartCount();
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const setCartOpen = useUiStore((s) => s.setCartOpen);
  const setMenuOpen = useUiStore((s) => s.setMenuOpen);
  const [query, setQuery] = useState("");

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/products");
  };

  return (
    <header className="sticky top-0 z-30 border-b bg-background">
      <div className="bg-primary px-4 py-2 text-center text-xs text-primary-foreground">
        {t("announcement.freeDelivery")} · {t("announcement.codAvailable")}
      </div>

      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setMenuOpen(true)}
          aria-label={t("nav.menu")}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Link href="/" className="shrink-0 text-xl font-bold text-primary">
          BanglaBazar
        </Link>

        <form onSubmit={submitSearch} className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={t("common.searchPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>

        <div className="hidden md:block">
          <LanguageSwitcher />
        </div>

        <Link
          href="/account"
          className={buttonVariants({ variant: "ghost", size: "icon" })}
          aria-label={t("nav.account")}
        >
          <User className="h-5 w-5" />
        </Link>

        <Link
          href="/wishlist"
          className={buttonVariants({ variant: "ghost", size: "icon" })}
          aria-label={t("nav.wishlist")}
        >
          <span className="relative">
            <Heart className="h-5 w-5" />
            {wishlistCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] text-white">
                {wishlistCount}
              </span>
            )}
          </span>
        </Link>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCartOpen(true)}
          aria-label={t("nav.cart")}
        >
          <span className="relative">
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-white">
                {cartCount}
              </span>
            )}
          </span>
        </Button>
      </div>

      <div className="border-t">
        <div className="mx-auto max-w-7xl px-4 py-2">
          {ready ? <CategoryNav categories={categories} /> : <div className="h-9" />}
        </div>
      </div>
    </header>
  );
}
