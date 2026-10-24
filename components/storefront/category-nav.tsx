"use client";

import Link from "next/link";
import type { Category } from "@/types";
import { useI18n } from "@/features/i18n";
import { t } from "@/lib/slug";
import { getChildren } from "@/services/catalog";

export function CategoryNav({ categories }: { categories: Category[] }) {
  const { locale } = useI18n();
  const top = getChildren(categories, null);

  return (
    <nav className="hidden lg:block">
      <ul className="flex items-center gap-1">
        {top.map((cat) => {
          const children = getChildren(categories, cat.id);
          return (
            <li key={cat.id} className="group relative">
              <Link
                href={`/categories/${cat.slug}`}
                className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
              >
                {t(locale, cat.name)}
              </Link>
              {children.length > 0 && (
                <ul className="invisible absolute left-0 top-full z-20 min-w-[220px] rounded-md border bg-background p-2 opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100">
                  {children.map((child) => {
                    const grand = getChildren(categories, child.id);
                    return (
                      <li key={child.id} className="group/child relative">
                        <Link
                          href={`/categories/${child.slug}`}
                          className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-accent"
                        >
                          {t(locale, child.name)}
                          {grand.length > 0 && <span className="text-muted-foreground">›</span>}
                        </Link>
                        {grand.length > 0 && (
                          <ul className="invisible absolute left-full top-0 min-w-[200px] rounded-md border bg-background p-2 opacity-0 shadow-lg transition-opacity group-hover/child:visible group-hover/child:opacity-100">
                            {grand.map((g) => (
                              <li key={g.id}>
                                <Link
                                  href={`/categories/${g.slug}`}
                                  className="block rounded-md px-3 py-2 text-sm hover:bg-accent"
                                >
                                  {t(locale, g.name)}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
