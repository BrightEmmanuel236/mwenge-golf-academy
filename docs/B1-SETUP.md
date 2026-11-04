# B1: saving the public forms (setup guide)

**Status:** this code ships switched **off**. Applying it changes no database, and production keeps
showing "Preview only: nothing was sent" until you turn saving on (B1 plan, amendment 1).

What B1 does: the enquiry, contact, sponsor and equipment-pledge forms can be saved to Supabase, each
returning a reference such as `MGA-ENQ-2026-0001`. What it does not do: send emails (B2), staff login
or admin screens (B3), take safeguarding concerns (the database refuses them until delivery to the
Safeguarding Lead exists), or take donations (still preview-only).

## 1. The database (already done on the current project)
The SQL in `supabase/drafts/b1_public_forms.sql` was **applied on 2026-11-04** to the Supabase project
`oqtefjnofyluwutkimpm` ("Mwenge Golf Academy") as migration `20261104024459 b1_public_forms`. Do not run it
again there. Checked on the live project afterwards: all 9 tables have row-level security on; the public
(`anon`) role holds no privilege on any table and can run no function; signed-in users hold only the minimum
staff access; the Supabase security advisor shows nothing about these objects beyond expected notes.

That project is currently your only one, so it serves as both staging and production. That is acceptable
while it holds no real data. **Before real client data arrives**, create a separate production project and
run the same SQL file there (PRD 9.1), then point production at it.

You can re-check the public key reaches nothing with
`STAGING_SUPABASE_URL=... STAGING_SUPABASE_PUBLISHABLE_KEY=... bun scripts/check-rls-staging.mjs`
(must print `PASS`), and run `supabase/tests/b1_access.test.sql` on an empty scratch Postgres (never a real project).

## 2. Settings (names only; never put values in git, `.env` or chat)
| Name | Kind | Value |
|---|---|---|
| `SUPABASE_URL` | server | the staging project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | server secret | the staging service key. Host secrets only (Vercel / Lovable). Never `.env`, never `VITE_`. |
| `THROTTLE_PEPPER` | server secret | random text, e.g. `openssl rand -hex 32`. Without it, saving is refused. |
| `FORMS_SAVING_ENABLED` | server | `true` |
| `VITE_FORMS_MODE` | public, set at build | `save` |

Set all five only for **Preview/staging** deployments (they point at the project above). In production leave `FORMS_SAVING_ENABLED`
and `VITE_FORMS_MODE` unset. `VITE_` values are baked in at build time, so redeploy after changing them.

## 3. Try it
Open a preview, submit the contact form, and expect a confirmation with a reference. Check the row in
the Supabase table editor (`contact_message`). Submitting a sixth time from one email within ten
minutes is refused with "Nothing was sent". If anything fails, the visitor sees "Not sent" and what
they typed stays in the form.

## 4. Before this can go live in production
- B2 (email to the academy, confirmation to the sender, direct safeguarding route) and an approved
  privacy notice, a named Safeguarding Lead and contact details (see `docs/LAUNCH-CHECKLIST.md`).
- Until then enquiries would sit in a table that nobody is alerted to.

## 5. Known limits
- Bot protection is a hidden honeypot field plus the rate limit. Cloudflare Turnstile is still a pending decision.
- The per-IP limit trusts the host's client-address header (Cloudflare and Vercel set it themselves); the per-email limit and the database rules do not depend on it.
- The contact form says "We reply within one business day". That is a promise only staff can keep; revisit it when B3 exists.

## 6. Turning it off
Unset `FORMS_SAVING_ENABLED` and `VITE_FORMS_MODE` and redeploy: forms return to preview mode. The
tables and any saved rows stay. Removing the tables is a separate, deliberate step: ask before doing it.
