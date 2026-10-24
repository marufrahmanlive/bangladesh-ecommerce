"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, CreditCard, Lock, MapPin, Smartphone, Truck, User, Wallet } from "lucide-react";
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

const STEP_ORDER = ["info", "delivery", "payment", "review"] as const;
type Step = (typeof STEP_ORDER)[number];

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

  const stepIndex = STEP_ORDER.indexOf(step);
  const stepLabels = [
    tr("checkout.customerInfo"),
    tr("checkout.deliveryMethod"),
    tr("checkout.paymentMethod"),
    tr("checkout.orderReview"),
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">{tr("checkout.title")}</h1>

      <ol className="mb-10 flex items-center">
        {stepLabels.map((label, i) => {
          const done = i < stepIndex;
          const current = i === stepIndex;
          return (
            <li key={label} className={cn("flex items-center", i < stepLabels.length - 1 && "flex-1")}>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                    done || current
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                    current && "ring-4 ring-primary/20",
                  )}
                >
                  {done ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                <span className={cn("hidden text-sm sm:block", current ? "font-semibold" : "text-muted-foreground")}>
                  {label}
                </span>
              </div>
              {i < stepLabels.length - 1 && (
                <span className={cn("mx-3 h-0.5 flex-1 rounded", i < stepIndex ? "bg-primary" : "bg-muted")} />
              )}
            </li>
          );
        })}
      </ol>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div>
          {step === "info" && (
            <div className="space-y-4 rounded-lg border p-5">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <User className="h-5 w-5 text-primary" /> {tr("checkout.customerInfo")}
              </h2>
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
                    "flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors",
                    deliveryMethod === m ? "border-primary bg-accent" : "hover:border-primary/50",
                  )}
                >
                  <input
                    type="radio"
                    name="delivery"
                    className="h-4 w-4 accent-[#0f766e]"
                    checked={deliveryMethod === m}
                    onChange={() => setDeliveryMethod(m)}
                  />
                  <Truck className="h-6 w-6 shrink-0 text-primary" />
                  <span className="flex-1">
                    <span className="block font-medium">{tr(`checkout.${m}`)}</span>
                    <span className="block text-xs text-muted-foreground">
                      {m === "standard" ? "2–5 working days" : "1–2 working days"}
                    </span>
                  </span>
                  <span className="font-semibold">
                    {shipping === 0 ? tr("common.free") : formatMoney(shipping, locale)}
                  </span>
                </label>
              ))}
            </div>
          )}

          {step === "payment" && (
            <div className="space-y-3">
              {([
                { m: "cod", icon: Wallet, desc: "Pay in cash when your order is delivered." },
                { m: "bkash", icon: Smartphone, desc: "Pay with bKash (sandbox)." },
                { m: "nagad", icon: Smartphone, desc: "Pay with Nagad (sandbox)." },
                { m: "card", icon: CreditCard, desc: "Debit / credit / prepaid card (sandbox)." },
              ] as { m: PaymentMethod; icon: typeof Wallet; desc: string }[]).map((opt) => (
                <label
                  key={opt.m}
                  className={cn(
                    "flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors",
                    paymentMethod === opt.m ? "border-primary bg-accent" : "hover:border-primary/50",
                  )}
                >
                  <input
                    type="radio"
                    name="payment"
                    className="h-4 w-4 accent-[#0f766e]"
                    checked={paymentMethod === opt.m}
                    onChange={() => setPaymentMethod(opt.m)}
                  />
                  <opt.icon className="h-6 w-6 shrink-0 text-primary" />
                  <span className="flex-1">
                    <span className="block font-medium">{tr(`checkout.${opt.m}`)}</span>
                    <span className="block text-xs text-muted-foreground">{opt.desc}</span>
                  </span>
                </label>
              ))}
              {paymentMethod !== "cod" && (
                <p className="flex items-center gap-2 rounded-md bg-warning/15 p-3 text-xs text-warning">
                  <Lock className="h-4 w-4" /> Demo/sandbox — live payments are not enabled.
                </p>
              )}
            </div>
          )}

          {step === "review" && (
            <div className="space-y-4 rounded-lg border p-5 text-sm">
              <h2 className="text-lg font-semibold">{tr("checkout.orderReview")}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-2">
                  <User className="mt-0.5 h-4 w-4 text-primary" />
                  <div>
                    <p className="font-medium">{form.getValues().fullName}</p>
                    <p className="text-muted-foreground">{form.getValues().phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                  <p className="text-muted-foreground">
                    {form.getValues().address}, {form.getValues().city},{" "}
                    {form.getValues().district}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-primary" />
                  <span>{tr(`checkout.${deliveryMethod}`)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-primary" />
                  <span>{tr(`checkout.${paymentMethod}`)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <aside className="h-fit space-y-4 rounded-lg border p-5 lg:sticky lg:top-24">
          <h2 className="flex items-center gap-2 font-semibold">
            <Lock className="h-4 w-4 text-primary" /> {tr("cart.title")}
          </h2>
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

          <div className="space-y-2">
            {step !== "review" ? (
              <Button
                className="w-full"
                onClick={() => {
                  if (step === "info") {
                    form.handleSubmit(() => setStep("delivery"))();
                  } else {
                    setStep(STEP_ORDER[stepIndex + 1]);
                  }
                }}
              >
                Continue →
              </Button>
            ) : (
              <Button className="w-full" onClick={submit} disabled={placing}>
                {placing ? tr("checkout.placing") : tr("checkout.placeOrder")}
              </Button>
            )}
            {step !== "info" && (
              <Button variant="ghost" className="w-full" onClick={() => setStep(STEP_ORDER[stepIndex - 1])}>
                ← Back
              </Button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}


