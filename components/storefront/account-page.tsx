"use client";

import Link from "next/link";
import { UserRound } from "lucide-react";
import { useI18n } from "@/features/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function AccountPage() {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">{t("nav.account")}</h1>
      <Card>
        <CardContent className="space-y-3 p-6">
          <UserRound className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            This demo storefront supports guest checkout. Real customer
            authentication is not enabled because data is stored only in your
            browser (localStorage prototype mode).
          </p>
          <div className="flex gap-2">
            <Link href="/orders/track">
              <Button variant="outline">{t("order.track")}</Button>
            </Link>
            <Link href="/admin">
              <Button>{t("nav.admin")}</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
