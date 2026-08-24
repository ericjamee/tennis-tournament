# Provo Tennis Tournament

Registration site for recurring community tennis tournaments in Provo, Utah. Built with Next.js 16, TypeScript, Tailwind CSS, Supabase, and Vercel.

## Local setup

1. Install Node 20+ and pnpm, then run `pnpm install`.
2. Copy `.env.example` to `.env.local`.
3. Create a Supabase project. In its SQL Editor, run every file in `supabase/migrations/` in filename order.
4. Add the project URL, anon key, and service-role key to `.env.local`. Never expose the service-role key with a `NEXT_PUBLIC_` prefix.
5. In Supabase Authentication, create the organizer under Users. That email/password signs in at `/admin`.
6. Run `pnpm dev` and open `http://localhost:3000`.

Without Supabase variables the public site runs in preview mode. Form submissions show a demo confirmation but are not persisted. Adding the variables activates database-backed registration, duplicate protection, numbered and capacity-safe waitlisting, admin login, private player data, editable tournament settings, player status and seed management, waitlist promotion, and CSV export.

## Database and security

The migrations create reusable `tournaments` and `registrations` tables, Labor Day 2026 seed data, RLS policies, public-safe aggregate counts, and transactional registration, restoration, and promotion functions. They lock the tournament row while assigning the final place, so concurrent submissions cannot exceed capacity. Public users cannot read registrations. The service-role key is only used server-side.

## Deploy to Vercel

Import `https://github.com/ericjamee/tennis-tournament` in Vercel or run `vercel --prod` here. Add the environment variables in Project Settings → Environment Variables. Set `NEXT_PUBLIC_SITE_URL` to the production URL and redeploy.

To add a custom domain later, open Project Settings → Domains, add the domain, and follow the DNS instructions.

## Optional services

- Resend: add `RESEND_API_KEY` and a verified `RESEND_FROM_EMAIL`. New players receive a registered or waitlisted confirmation. Registration remains functional if email is not configured or delivery fails.
- Stripe: the schema supports `payment_method = 'stripe'`, but checkout is intentionally disabled. Add Checkout and webhook fulfillment before selecting it.

## Quality checks

Run `pnpm lint`, `pnpm typecheck`, and `pnpm build` before deployment.
