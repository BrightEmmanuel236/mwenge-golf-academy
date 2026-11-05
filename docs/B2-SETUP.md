# B2: email notifications, retries and safeguarding intake (setup guide)

**Status:** the code ships ready, but email only works once the settings below exist, and the database
changes in `supabase/drafts/b2_email_and_safeguarding.sql` are **not applied until the owner approves**
(apply B1 first; B1's SQL is already applied). Nothing here switches on form saving: that is still B1's two flags.

## What it does
- After a submission is **saved**, the server sends two emails: a notification to the academy's staff
  addresses (reply-to is the sender) and a plain confirmation to the sender. The save never waits on or
  depends on email: if email fails the visitor still gets their reference.
- Every email is recorded in `email_log` (which email, for whom by kind, sent or failed, error code). The log
  holds **no addresses and no message text**.
- Failed emails are retried by calling `/api/email-retry` (below). It also catches a submission that was
  saved but never emailed (for example the server stopped in between), so nothing saved is lost.
- A child's first name, age and the guardian declaration are **never put in email**. The staff email for a
  junior enquiry says so; staff open the record to see them.
- Subjects contain only fixed wording and the reference, never anything the sender typed.

## 1. Apply the database changes (after approval)
Run `supabase/drafts/b2_email_and_safeguarding.sql` once on the project (after B1). Then mark the file
as applied, as was done for B1. Test it first on an empty scratch Postgres with `supabase/tests/`.

## 2. Email provider (Resend)
Create a Resend account and an API key. **Until a domain is verified (SPF/DKIM), Resend delivers only to
the email address of the Resend account itself.** For testing: sign up with one of your addresses, use
that same address for `STAFF_NOTIFY_EMAILS`, `SAFEGUARDING_EMAILS` and as the test visitor, and use
`onboarding@resend.dev` as the sender. To email real visitors, verify the academy's domain and send from it.

## 3. Settings (names only; values never go in git, `.env` or chat)
| Name | Kind | Meaning |
|---|---|---|
| `RESEND_API_KEY` | server secret | Resend API key |
| `EMAIL_FROM` | server | e.g. `Mwenge Golf Academy <onboarding@resend.dev>` while testing |
| `STAFF_NOTIFY_EMAILS` | server | staff addresses, comma separated (max 10) |
| `SAFEGUARDING_EMAILS` | server | safeguarding addresses only, comma separated |
| `ACADEMY_REPLY_TO` | server, optional | where a visitor's reply to the confirmation goes |
| `CRON_SECRET` | server secret | 16+ random characters; enables `/api/email-retry` |
| `SAFEGUARDING_INTAKE_ENABLED` | server | leave **unset** (see section 5) |

Addresses are settings, not code, so they can change without a deploy and never appear in the public repo.
If the key or sender is missing, submissions still save; the emails are recorded as `not_configured`
(this does not use up retries) and go out on the next retry once the settings are fixed.

## 4. Scheduling retries
Call `GET` or `POST https://<site>/api/email-retry` with the header `Authorization: Bearer <CRON_SECRET>`.
Without a schedule, failed emails wait until someone calls it. Options: Vercel Cron (Vercel sends that
header automatically when a `CRON_SECRET` setting exists; check your plan's cron frequency, since
Hobby plans only run daily), a scheduled GitHub Action, or any cron service. Every 10 minutes is plenty.
The endpoint returns only counts, does not exist without `CRON_SECRET`, and refuses a wrong token.

## 5. Safeguarding intake
A server path exists (`src/lib/safeguarding.functions.ts`) that saves a concern with no contact record and
alerts only `SAFEGUARDING_EMAILS`, never general staff and never the reporter. It is **off** and has **no
screen**: it needs the client's approved wording and a named Safeguarding Lead (PRD W10 [CONFIRM]). To
enable it later: set the lead's address(es), set `SAFEGUARDING_INTAKE_ENABLED=true`, and add the screen.

## 6. Try it (on a preview, with the B1 settings also set)
Submit the contact form; expect a reference, then a staff email and a confirmation. Check the
`email_log` table: two rows, `sent`. To test failure, set a wrong `RESEND_API_KEY`: the visitor still gets a
reference, the log shows `failed` with `http_401` (or similar), and after fixing the key a call to
`/api/email-retry` sends them.

## 7. Known limits
- No bounce or delivery tracking beyond the provider accepting the email.
- The confirmation goes to whatever address was typed; the per-email rate limit (5 per 10 minutes) caps misuse.
- Sending happens during the request (about half a second extra, 8-second limit per email).
- The admin screens to see the log arrive in B3; until then read `email_log` in the Supabase table editor.
