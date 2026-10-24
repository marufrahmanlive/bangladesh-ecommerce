# Deployment & Security

## Deployment

1. `npm run build && npm run start` (or deploy to Vercel/Node hosting).
2. Set environment variables from `.env.example` (never commit secrets).
3. Configure HTTPS (automatic on Vercel; otherwise use a TLS terminator).
4. If MongoDB is configured, ensure a replica set for transactions.

## Security checklist

- Separate browser UI from trusted server-side business logic.
- Validate all input on the server (Zod schemas already exist).
- Enforce authentication + authorization for admin actions (roles in
  `types/user.ts`).
- Protect against unauthorized order access (server-side ownership checks).
- CSRF protection for cookie-based authentication.
- Rate limiting on authentication, reviews, checkout and payment endpoints.
- Secure, httpOnly, SameSite cookies for production auth.
- Prevent mass assignment / unsafe object updates (explicit field mapping).
- Validate uploads (file type + size) and restrict allowed types.
- Payment webhook signature verification (see `docs/PAYMENTS.md`).
- Idempotent payment and order processing (already implemented client-side).
- Database transactions for order placement, stock deduction, financial
  postings.
- Audit logs for sensitive admin operations.
- Do not expose internal errors or secrets to clients.
- Data minimization and retention/anonymization policy for customers.
- Backups, recovery, logging and monitoring plan.
- Security headers (Content-Security-Policy, X-Frame-Options, etc.) via
  `next.config.ts` headers or a proxy.
