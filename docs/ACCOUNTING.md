# Accounting Model & Assumptions

This is a **simplified, single-entry register** intended for demonstration. It
is not a substitute for compliant double-entry accounting.

## Money

All amounts are integer poisha (1 BDT = 100 poisha). No floating point.

## Entries

`AccountingEntry` (`types/finance.ts`) has `type`, `account`, and a signed
`amountMinor` (positive = inflow to the account, negative = outflow).

Entry types used:

- `sale` → account `sales` (revenue recognized at order placement).
- `cod_collection` → account `cash` (only when COD is actually collected).
- `customer_payment` → account `cash`/`bank` (online payments).
- `expense` → account `expenses` (negative).
- `income` → account `income`.
- `opening` → opening balances.

## Key formulas

- **Gross sales** = sum of order `subtotalMinor` (excl. cancelled/failed/refunded).
- **Net sales** = gross sales − order discounts.
- **COGS** = sum of `variant.costMinor × quantity` for sold items.
- **Gross profit** = net sales − COGS.
- **Net profit** = gross profit + other income − operating expenses.
- **Customer receivables** = unpaid COD orders (outstanding).
- **Supplier payables** = unpaid supplier purchases (not fully implemented in demo).
- **Cash balance** = cash inflows − cash outflows + opening (per `cashFlow`).

## Rules

- Unpaid COD orders are **not** counted as collected cash.
- Pending online payments are **not** counted as received revenue.
- Refunds and returned inventory are not double-counted.
- Sales revenue, payment collection, inventory movement and accounting entries
  are recorded separately with a traceable `referenceType`/`referenceId`.
- Duplicate postings are prevented by reference + type checks.
