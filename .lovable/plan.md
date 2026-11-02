# B1: Save the public forms in Supabase (no admin screens, no emails yet)

## Goal
Make the training enquiry, contact, sponsor and equipment pledge forms really save each submission, with a reference number, in your own Supabase project. Visitors only see "received" after the save works. Donations and talent profiles stay out of B1.

## What visitors will notice
- After sending a form they see "Thank you, your reference is MGA-ENQ-2026-0001" (PRD §5 header). The "Preview only: nothing was sent" box goes away for these four forms only.
- If saving fails they see a clear "not sent, please try again" message, and what they typed stays in the form (PRD §11.4).
- The donation form stays preview-only (no payment provider yet).

## Scope (PRD references)
1. **Staff roles foundation (§8.1, §9.2 staff_profile).** A separate roles list with the four PRD roles (super admin, academy admin, content manager, safeguarding lead) and a safe role-check helper. No staff logins or admin pages yet; the first super admin is added by hand later.
2. **People and submissions tables (§9.2):** contact_person, enquiry, contact_message, sponsor_enquiry, equipment_pledge, equipment_pledge_item. Each has a status from the PRD workflow (W1, W3, W4, W9), timestamps and a unique reference (MGA-ENQ / MGA-MSG / MGA-SPN / MGA-PLG + year + number).
3. **Database rules (§9.3, §10.1):** row security on every table. The public can't read anything. The public can't write directly either: forms save only through server code that checks the input again. Staff read and update according to the permission matrix (§8.2). Content managers can't see enquiries.
4. **Server-side checks (§5, AC-E2, AC-E3, AC-E4):** the existing form rules re-run on the server. Junior enquiries need guardian details and the declaration (child age 4–17). Hidden bot trap. Simple limit per sender (for example 5 submissions per 10 minutes).
5. **Forms wired up:** enquiry, contact, sponsor and pledge forms call the server and show the reference. Safeguarding concerns on the contact form are stored with restricted access (W10, AC-Q3).
6. **Tests:** reference format, junior guardian rule, bot trap, rate limit, and a check that the public can't read the tables.

## Not in B1 (later phases, each approved separately)
- **B2:** emails (sender confirmation + staff notification, email log). Needs a decision on the email provider and the academy's sending domain.
- **B3:** staff login with MFA, admin inbox for enquiries/messages/pledges/sponsors, status changes, notes, audit log, 2-business-day highlight (AC-E5, AC-E6).
- **B4:** media library on Supabase Storage replacing the interim photos (§7).
- **B5:** programs, events, news, partners and impact figures managed from admin instead of sample files.
- **B6:** donations with the chosen payment provider (W2).
- **B7:** talent profiles with consent records (W5, §7.7).

## Decisions needed from you
- Rate limit of 5 submissions per sender per 10 minutes: OK?
- Until emails arrive in B2, submissions are only visible in Supabase. Is that acceptable for the B1 period?

## Technical details
- Migrations run against the user's external Supabase (not Lovable Cloud). Each new public table gets explicit GRANTs: none to anon, select/update to authenticated limited by policy, all to service_role.
- `app_role` enum + `user_roles` table + `has_role()` security-definer function; policies use `has_role(auth.uid(), ...)`.
- References are generated in the database by a per-type yearly counter (function plus sequence table), so they're unique even when two people submit at the same time.
- Forms go through `createServerFn` handlers that validate with the existing zod schemas from `src/lib/schemas/*`. They load the admin client inside the handler only after validation, check the honeypot and the rate limit (a hashed sender key stored in a small `submission_throttle` table), then insert the contact_person (upsert by email) and the submission in one database function call.
- `formsConnected` is switched per form; the PreviewNotice remains only for the donation form.
- AGENTS.md gets a rule: public form writes go only through validated server functions, never through browser inserts.
