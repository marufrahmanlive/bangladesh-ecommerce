"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { useI18n } from "@/features/i18n";
import { useCatalog } from "@/features/catalog/store";
import { formatMoney } from "@/lib/format";
import { orderStatusLabel, paymentStatusLabel } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function CheckoutSuccessPage() {
  const { locale, t } = useI18n();
  const { orders } = useCatalog();
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order") ?? "";
  const order = orders.find((o) => o.orderNumber === orderNumber);

  return (
    <div className="mx-auto max-w-xl px-4 py-10 text-center">
      <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
      <h1 className="mt-4 text-2xl font-bold">{t("checkout.thankYou")}</h1>
      <p className="mt-2 text-muted-foreground">{t("checkout.orderPlaced")}</p>

      {order && (
        <Card className="mt-6 text-left">
          <CardContent className="space-y-2 p-6">
            <p>
              <span className="font-medium">{t("checkout.orderNumber")}:</span>{" "}
              {order.orderNumber}
            </p>
            <p>
              <span className="font-medium">{t("order.status")}:</span>{" "}
              {orderStatusLabel(locale, order.status)}
            </p>
            <p>
              <span className="font-medium">{t("order.payment")}:</span>{" "}
              {paymentStatusLabel(locale, order.paymentStatus)}
            </p>
            <p className="text-lg font-bold text-primary">
              {formatMoney(order.totalMinor, locale)}
            </p>
            <p className="text-xs text-muted-foreground">{t("checkout.paymentPending")}</p>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 flex justify-center gap-2">
        <Link href="/orders/track">
          <Button variant="outline">{t("order.track")}</Button>
        </Link>
        <Link href="/products">
          <Button>{t("common.continueShopping")}</Button>
        </Link>
      </div>
    </div>
  );
}
