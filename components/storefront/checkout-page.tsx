"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import type { DeliveryMethod, PaymentMethod } from "@/types";
import { useI18n } from "@/features/i18n";
import { useCatalog } from "@/features/catalog/store";
import { useCartStore } from "@/features/cart/store";
import { useUiStore } from "@/features/ui/store";
import { formatMoney } from "@/lib/format";
import { t } from "@/lib/slug";
import { BANGLADESH_PHONE_REGEX } from "@/lib/validation";
import { cartSubtotalMinor, cartTotals } from "@/services/cart";
import { computeShippingMinor, evaluateCoupon, placeOrder } from "@/services/checkout";
import { BANGLADESH_DISTRICTS } from "@/lib/seed-data";
import { ProductImage } from "./product-image";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const checkoutSchema = z.object({
  fullName: z.string().min(1, "nameRequired"),
  phone: z.string().regex(BANGLADESH_PHONE_REGEX, "phoneInvalid"),
  email: z.string().email("emailInvalid").optional().or(z.literal("")),
  district: z.string().min(1, "districtRequired"),
  city: z.string().min(1, "cityRequired"),
  address: z.string().min(1, "addressRequired"),
  instructions: z.string().optional(),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

const STEPS = ["cart", "info", "delivery", "payment", "review"] as const;
type Step = (typeof STEPS)[number];

export function CheckoutPage() {
  const { locale, t: tr } = useI18n();
  const router = useRouter();
  const { repos, settings, refresh } = useCatalog();
  const items = useCartStore((s) => s.items);
  const clear = useCartStore((s) => s.clear);
  const addToast = useUiStore((s) => s.addToast);

  const [step, setStep] = useState<Step>("info");
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("standard");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [couponCode, setCouponCode] = useState("");
  const [couponResult, setCouponResult] = useState<ReturnType<typeof evaluateCoupon> | null>(null);
  const [placing, setPlacing] = useState(false);
  const idempotencyKeyRef = useRef<string | null>(null);

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      district: "",
      city: "",
      address: "",
      instructions: "",
    },
  });

  const subtotal = cartSubtotalMinor(items);
  const district = useWatch({ control: form.control, name: "district" });
  const shipping = useMemo(
    () =>
      settings && district
        ? computeShippingMinor(settings, district, subtotal)
        : 0,
    [settings, district, subtotal],
  );
  const totals = cartTotals(items, {
    couponDiscountMinor: couponResult?.ok ? couponResult.discountMinor : 0,
    shippingMinor: shipping,
  });

  const applyCoupon = () => {
    if (!repos || !couponCode.trim()) return;
    const result = evaluateCoupon(repos, couponCode, items, subtotal);
    setCouponResult(result);
    if (result.ok) addToast(tr("checkout.couponApplied"), "success");
    else addToast(tr("checkout.couponInvalid"), "error");
  };

  const submit = form.handleSubmit(async (values) => {
    if (!repos) return;
    setPlacing(true);
    const customer = {
      fullName: values.fullName,
      phone: values.phone,
      email: values.email || undefined,
      district: values.district,
      city: values.city,
      address: values.address,
      instructions: values.instructions || undefined,
    };
    const idempotencyKey =
      idempotencyKeyRef.current ??
      (idempotencyKeyRef.current = `ck_${Date.now()}_${Math.random().toString(36).slice(2)}`);
    const result = placeOrder(repos, {
      customer,
      items,
      deliveryMethod,
      paymentMethod,
      couponCode: couponResult?.ok ? couponCode : undefined,
      notes: values.instructions,
      idempotencyKey,
    });
    setPlacing(false);
    if (result.ok && result.order) {
      clear();
      refresh();
      router.push(`/checkout/success?order=${encodeURIComponent(result.order.orderNumber)}`);
    } else {
      addToast(tr("toast.error"), "error");
    }
  });

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-center">
        <h1 className="text-2xl font-bold">{tr("checkout.title")}</h1>
        <p className="mt-2 text-muted-foreground">{tr("common.emptyCart")}</p>
        <Link href="/products" className="mt-4 inline-block">
          <Button>{tr("common.continueShopping")}</Button>
        </Link>
      </div>
    );
  }

  const err = (field: keyof CheckoutForm) => {
    const message = form.formState.errors[field]?.message;
    return message ? tr(`checkout.${message}`) : undefined;
  };

  const stepIndex = STEPS.indexOf(step);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{tr("checkout.title")}</h1>

      <ol className="mb-8 flex flex-wrap items-center gap-2 text-sm">
        {(["info", "delivery", "payment", "review"] as Step[]).map((s, i) => (
          <li key={s} className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                stepIndex === i ? "bg-primary text-primary-foreground" : "bg-muted",
              )}
            >
              {i + 1}
            </span>
            <span className={stepIndex === i ? "font-medium" : "text-muted-foreground"}>
              {tr(
                `checkout.${
                  s === "info"
                    ? "customerInfo"
                    : s === "delivery"
                      ? "deliveryMethod"
                      : s === "payment"
                        ? "paymentMethod"
                        : "orderReview"
                }`,
              )}
            </span>
            {i < 3 && <span className="text-muted-foreground">›</span>}
          </li>
        ))}
      </ol>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          {step === "info" && (
            <div className="space-y-4 rounded-lg border p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="fullName" className="mb-1 block">{tr("checkout.fullName")}</Label>
                  <Input id="fullName" {...form.register("fullName")} />
                  {err("fullName") && <p className="mt-1 text-xs text-destructive">{err("fullName")}</p>}
                </div>
                <div>
                  <Label htmlFor="phone" className="mb-1 block">{tr("checkout.phone")}</Label>
                  <Input id="phone" placeholder="01XXXXXXXXX" {...form.register("phone")} />
                  {err("phone") && <p className="mt-1 text-xs text-destructive">{err("phone")}</p>}
                </div>
              </div>
              <div>
                <Label htmlFor="email" className="mb-1 block">{tr("checkout.email")}</Label>
                <Input id="email" type="email" {...form.register("email")} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="district" className="mb-1 block">{tr("checkout.district")}</Label>
                  <Select id="district" {...form.register("district")}>
                    <option value="">{tr("checkout.district")}</option>
                    {BANGLADESH_DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </Select>
                  {err("district") && <p className="mt-1 text-xs text-destructive">{err("district")}</p>}
                </div>
                <div>
                  <Label htmlFor="city" className="mb-1 block">{tr("checkout.city")}</Label>
                  <Input id="city" {...form.register("city")} />
                  {err("city") && <p className="mt-1 text-xs text-destructive">{err("city")}</p>}
                </div>
              </div>
              <div>
                <Label htmlFor="address" className="mb-1 block">{tr("checkout.address")}</Label>
                <Textarea id="address" {...form.register("address")} />
                {err("address") && <p className="mt-1 text-xs text-destructive">{err("address")}</p>}
              </div>
              <div>
                <Label htmlFor="instructions" className="mb-1 block">{tr("checkout.instructions")}</Label>
                <Textarea id="instructions" {...form.register("instructions")} />
              </div>
            </div>
          )}

          {step === "delivery" && (
            <div className="space-y-3">
              {(["standard", "express"] as DeliveryMethod[]).map((m) => (
                <label
                  key={m}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-4",
                    deliveryMethod === m ? "border-primary bg-accent" : "",
                  )}
                >
                  <input
                    type="radio"
                    name="delivery"
                    checked={deliveryMethod === m}
                    onChange={() => setDeliveryMethod(m)}
                  />
                  <span className="font-medium">{tr(`checkout.${m}`)}</span>
                </label>
              ))}
            </div>
          )}

          {step === "payment" && (
            <div className="space-y-3">
              {(["cod", "bkash", "nagad", "card"] as PaymentMethod[]).map((m) => (
                <label
                  key={m}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-4",
                    paymentMethod === m ? "border-primary bg-accent" : "",
                  )}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === m}
                    onChange={() => setPaymentMethod(m)}
                  />
                  <span className="font-medium">{tr(`checkout.${m}`)}</span>
                </label>
              ))}
              {paymentMethod !== "cod" && (
                <p className="rounded-md bg-warning/15 p-3 text-xs text-warning">
                  Demo/sandbox — live payments off.
                </p>
              )}
            </div>
          )}

          {step === "review" && (
            <div className="space-y-3 rounded-lg border p-4 text-sm">
              <p>
                <span className="font-medium">{tr("checkout.customerInfo")}:</span>{" "}
                {form.getValues().fullName} · {form.getValues().phone}
              </p>
              <p>
                <span className="font-medium">{tr("checkout.deliveryAddress")}:</span>{" "}
                {form.getValues().address}, {form.getValues().city},{" "}
                {form.getValues().district}
              </p>
              <p>
                <span className="font-medium">{tr("checkout.deliveryMethod")}:</span>{" "}
                {tr(`checkout.${deliveryMethod}`)}
              </p>
              <p>
                <span className="font-medium">{tr("checkout.paymentMethod")}:</span>{" "}
                {tr(`checkout.${paymentMethod}`)}
              </p>
            </div>
          )}
        </div>

        <aside className="h-fit space-y-4 rounded-lg border p-4">
          <h2 className="font-semibold">{tr("cart.title")}</h2>
          <div className="max-h-60 space-y-2 overflow-auto">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-2 text-sm">
                <div className="relative h-12 w-12 shrink-0">
                  <ProductImage src={item.image} alt={t(locale, item.name)} className="h-full w-full" />
                </div>
                <span className="line-clamp-1 flex-1">{t(locale, item.name)}</span>
                <span className="text-muted-foreground">×{item.quantity}</span>
              </div>
            ))}
          </div>

          <div className="space-y-1 border-t pt-2 text-sm">
            <div className="flex justify-between">
              <span>{tr("common.subtotal")}</span>
              <span>{formatMoney(totals.subtotalMinor, locale)}</span>
            </div>
            <div className="flex justify-between text-success">
              <span>{tr("cart.itemDiscount")}</span>
              <span>-{formatMoney(totals.itemDiscountMinor, locale)}</span>
            </div>
            {couponResult?.ok && (
              <div className="flex justify-between text-success">
                <span>{tr("cart.couponDiscount")}</span>
                <span>-{formatMoney(couponResult.discountMinor ?? 0, locale)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>{tr("common.shipping")}</span>
              <span>{shipping === 0 ? tr("common.free") : formatMoney(shipping, locale)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 font-semibold">
              <span>{tr("common.total")}</span>
              <span>{formatMoney(totals.totalMinor, locale)}</span>
            </div>
          </div>

          {step === "review" && (
            <div className="flex gap-2">
              <Input
                placeholder={tr("checkout.coupon")}
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
              />
              <Button variant="outline" onClick={applyCoupon}>
                {tr("checkout.applyCoupon")}
              </Button>
            </div>
          )}

          <div className="flex justify-between gap-2">
            {step !== "info" ? (
              <Button variant="outline" onClick={() => setStep(STEPS[stepIndex - 1])}>
                ←
              </Button>
            ) : (
              <span />
            )}
            {step !== "review" ? (
              <Button
                onClick={() => {
                  if (step === "info") {
                    form.handleSubmit(() => setStep("delivery"))();
                  } else {
                    setStep(STEPS[stepIndex + 1]);
                  }
                }}
              >
                →
              </Button>
            ) : (
              <Button onClick={submit} disabled={placing}>
                {placing ? tr("checkout.placing") : tr("checkout.placeOrder")}
              </Button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}


