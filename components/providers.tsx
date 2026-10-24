"use client";

import { useEffect } from "react";
import { useI18nStore } from "@/features/i18n";
import { useCatalogStore } from "@/features/catalog/store";
import { useCartStore } from "@/features/cart/store";
import { useWishlistStore } from "@/features/wishlist/store";
import { Toaster } from "@/components/ui/toaster";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    useI18nStore.getState().hydrate();
    useCatalogStore.getState().init();
    useCartStore.getState().hydrate();
    useWishlistStore.getState().hydrate();
  }, []);

  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
