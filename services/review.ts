import type { Repos } from "@/repositories";
import type { Review } from "@/types";

export interface RatingSummary {
  average: number;
  count: number;
  distribution: Record<number, number>;
}

export function ratingSummary(
  reviews: Review[],
  productId: string,
): RatingSummary {
  const productReviews = reviews.filter((r) => r.productId === productId && !r.hidden);
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let total = 0;
  for (const r of productReviews) {
    const star = Math.min(5, Math.max(1, Math.round(r.rating)));
    distribution[star] += 1;
    total += r.rating;
  }
  const count = productReviews.length;
  return {
    average: count ? Math.round((total / count) * 10) / 10 : 0,
    count,
    distribution,
  };
}

export function buildRatingMap(repos: Repos): Map<string, RatingSummary> {
  const reviews = repos.reviews.getAll();
  const map = new Map<string, RatingSummary>();
  for (const p of repos.products.getAll()) {
    map.set(p.id, ratingSummary(reviews, p.id));
  }
  return map;
}

export function sortReviews(reviews: Review[], sort: "newest" | "highest" | "helpful"): Review[] {
  return [...reviews].sort((a, b) => {
    if (sort === "highest") return b.rating - a.rating;
    if (sort === "helpful") return b.helpful - a.helpful;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}
