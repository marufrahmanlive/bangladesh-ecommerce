import type { PaymentMethod, PaymentStatus } from "@/types";
import { uid } from "@/lib/utils";

export interface PaymentInitiation {
  status: "sandbox_ready" | "pending" | "requires_action";
  method: PaymentMethod;
  transactionId: string;
  sandbox: boolean;
  message: string;
  redirectUrl?: string;
}

export interface PaymentVerification {
  success: boolean;
  transactionId: string;
  reference?: string;
  message: string;
}

export interface RefundResult {
  ok: boolean;
  message: string;
}

export interface PaymentProvider {
  method: PaymentMethod;
  label: string;
  isLive: boolean;
  initiate(amountMinor: number, orderNumber: string): Promise<PaymentInitiation>;
  verify(transactionId: string): Promise<PaymentVerification>;
  refund(transactionId: string, amountMinor: number): Promise<RefundResult>;
}

const SANDBOX_NOTE =
  "Demo/sandbox mode. Live online payments are not enabled — no real money is moved.";

class CodProvider implements PaymentProvider {
  method: PaymentMethod = "cod";
  label = "Cash on Delivery";
  isLive = false;
  async initiate(amountMinor: number, orderNumber: string): Promise<PaymentInitiation> {
    return {
      status: "pending",
      method: "cod",
      transactionId: uid("cod"),
      sandbox: true,
      message: "Pay in cash when your order is delivered. Payment is marked collected only after authorized confirmation.",
    };
  }
  async verify(transactionId: string): Promise<PaymentVerification> {
    return {
      success: false,
      transactionId,
      message: "COD payment must be confirmed manually by an authorized administrator.",
    };
  }
  async refund(transactionId: string, amountMinor: number): Promise<RefundResult> {
    return { ok: true, message: "COD refund recorded as a manually processed refund." };
  }
}

class BkashSandboxProvider implements PaymentProvider {
  method: PaymentMethod = "bkash";
  label = "bKash (Sandbox)";
  isLive = false;
  async initiate(amountMinor: number, orderNumber: string): Promise<PaymentInitiation> {
    return {
      status: "sandbox_ready",
      method: "bkash",
      transactionId: uid("bkash"),
      sandbox: true,
      message: SANDBOX_NOTE,
      redirectUrl: undefined,
    };
  }
  async verify(transactionId: string): Promise<PaymentVerification> {
    return { success: false, transactionId, message: SANDBOX_NOTE };
  }
  async refund(transactionId: string, amountMinor: number): Promise<RefundResult> {
    return { ok: false, message: "Refunds require live bKash credentials." };
  }
}

class NagadSandboxProvider implements PaymentProvider {
  method: PaymentMethod = "nagad";
  label = "Nagad (Sandbox)";
  isLive = false;
  async initiate(amountMinor: number, orderNumber: string): Promise<PaymentInitiation> {
    return {
      status: "sandbox_ready",
      method: "nagad",
      transactionId: uid("nagad"),
      sandbox: true,
      message: SANDBOX_NOTE,
    };
  }
  async verify(transactionId: string): Promise<PaymentVerification> {
    return { success: false, transactionId, message: SANDBOX_NOTE };
  }
  async refund(transactionId: string, amountMinor: number): Promise<RefundResult> {
    return { ok: false, message: "Refunds require live Nagad credentials." };
  }
}

class CardSandboxProvider implements PaymentProvider {
  method: PaymentMethod = "card";
  label = "Card (Sandbox)";
  isLive = false;
  async initiate(amountMinor: number, orderNumber: string): Promise<PaymentInitiation> {
    return {
      status: "sandbox_ready",
      method: "card",
      transactionId: uid("card"),
      sandbox: true,
      message: SANDBOX_NOTE,
    };
  }
  async verify(transactionId: string): Promise<PaymentVerification> {
    return { success: false, transactionId, message: SANDBOX_NOTE };
  }
  async refund(transactionId: string, amountMinor: number): Promise<RefundResult> {
    return { ok: false, message: "Refunds require a live card gateway." };
  }
}

export const PAYMENT_PROVIDERS: PaymentProvider[] = [
  new CodProvider(),
  new BkashSandboxProvider(),
  new NagadSandboxProvider(),
  new CardSandboxProvider(),
];

export function getPaymentProvider(method: PaymentMethod): PaymentProvider {
  return (
    PAYMENT_PROVIDERS.find((p) => p.method === method) ?? PAYMENT_PROVIDERS[0]
  );
}

export type { PaymentStatus };
