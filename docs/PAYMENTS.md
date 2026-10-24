# Payment Gateway Configuration

Payment methods are implemented behind the `PaymentProvider` interface in
`services/payment.ts`. The demo ships four providers: COD, bKash (sandbox),
Nagad (sandbox) and Card (sandbox). Sandbox providers **never fabricate
success** — they return clearly-labelled demo instructions.

## Security rules (all providers)

- API credentials live in **server-side** environment variables only.
- Never store full card numbers, CVVs, PINs, OTPs, or gateway secrets.
- Verify payment results on the server via webhook/callback signature.
- Use idempotency keys to prevent duplicate charges/orders.
- Never mark an order paid only because the browser landed on a success page.

## COD

No credentials. Payment is recorded as `pending` at order creation and marked
`collected` only through `markPaymentCollected()` (authorized confirmation).

## bKash

Use the official bKash Checkout API. Required env vars:

```
BKASH_APP_KEY=
BKASH_APP_SECRET=
BKASH_USERNAME=
BKASH_PASSWORD=
BKASH_BASE_URL=        # sandbox: https://tokenized.sandbox.bka.sh/v1.2.0-beta
BKASH_CALLBACK_URL=
```

Flow: create payment → redirect → callback → execute payment → verify. Replace
`BkashSandboxProvider` with a live provider that calls these endpoints and
verifies the callback against bKash's server.

## Nagad

Use the authorized Nagad merchant gateway. Required env vars:

```
NAGAD_MERCHANT_ID=
NAGAD_PUBLIC_KEY=
NAGAD_PRIVATE_KEY=
NAGAD_BASE_URL=
NAGAD_CALLBACK_URL=
```

Sign requests with the private key and verify callbacks with the gateway's
public key.

## Card (debit/credit/prepaid)

Use a licensed payment aggregator that accepts Bangladeshi cards. Required:

```
CARD_GATEWAY_API_KEY=
CARD_GATEWAY_BASE_URL=
CARD_GATEWAY_WEBHOOK_SECRET=
```

Verify webhook signatures with `CARD_GATEWAY_WEBHOOK_SECRET`.

## Refunds

Refunds must be initiated and verified through the relevant provider, or
recorded as a manually processed refund with appropriate authorization. Never
assume cancelling an order automatically reverses a real payment.
