# B3: staff sign-in and the admin inbox (setup guide)

The staff area lives at `/admin` (not linked from the public site, never indexed). Staff sign in with an
email and password, then a 6-digit code from an authenticator app. Until that second step is done, the
database returns nothing to them: the rule is enforced in the database, not only on screen.

## 1. Database hardening (needs approval, then run once)
Lovable's B3 migration (`20261106121130`) is already applied. `supabase/drafts/b3_hardening.sql` goes on top:
it removes the default public privileges Supabase put on `audit_log` (including `TRUNCATE`), makes the audit
log append-only for everyone including the server key, restricts its fields, and puts a length limit on notes.
Apply it before anyone signs in. It can be re-checked on an empty scratch Postgres with `supabase/tests/`
(the B3 suite fails without it and passes with it).

## 2. Settings in the Supabase dashboard (you must do these)
1. **Turn off public sign-ups.** Authentication > Sign In / Providers > Email: switch off "Allow new users to
   sign up". Staff accounts are created by you; the app has no sign-up screen and the screens never create accounts.
2. **Check multi-factor.** Authentication > Multi-Factor: TOTP (authenticator app) must be enabled (it is by default).
3. Optional: set a strong minimum password length (Authentication > Policies).

## 3. Create the first super administrator
1. Authentication > Users > Add user > Create new user. Enter the email and a strong password and tick
   "Auto confirm user".
2. In the SQL editor, give that user the role (replace the email):

       insert into public.user_roles (user_id, role)
       select id, 'super_admin' from auth.users where email = 'the-super-admin@example.org';

3. Open `/admin`, sign in with the password, and on the first sign-in scan the QR code with an authenticator
   app and enter the code. After that every sign-in asks for the current code.

Other staff: create the user the same way and give one role: `academy_admin` (works enquiries, messages,
sponsors and pledges), `safeguarding_lead` (reads everything, works safeguarding reports only),
`content_manager` (no submissions) or `super_admin`. A person with no role sees a message saying so.

## 4. What staff can do
- Dashboard with new and overdue counts. Overdue = still "new" after 2 business days (Mon to Fri, Kampala time).
- Lists per kind (filter by status, 25 per page, newest first) and a record page showing everything the sender
  submitted. For a junior enquiry that includes the child's details, with a warning that they are never emailed.
- Change a record's status and internal notes. The database refuses to change anything the sender wrote.
- History: who changed the status or notes and when (note text is never copied into the history), and whether
  the staff and sender emails were sent.
- Safeguarding reports are visible and workable only by the Safeguarding Lead and Super Administrator.

## 5. Smoke test on a preview (about 10 minutes)
1. Visit `/admin` signed out: you land on the sign-in page. Search engines are told not to index it.
2. Sign in with a wrong password: one generic message. With the right one: you are asked for a code, not shown data.
3. Finish the code step: dashboard and your role badge appear. Submit a test enquiry from the public site
   (with saving switched on for the preview) and find it in the list.
4. Open it, change the status, add a note, save. History shows your change; the note text is not in it.
5. Sign out; `/admin/enquiries` sends you back to sign in.

## 6. Known limits
- Tested against a stand-in for Supabase's sign-in and data services and against a real Postgres for the access
  rules, not yet against your real Supabase project: do the smoke test above before relying on it.
- There is no "forgot password" screen and no staff-management screen yet; the owner resets passwords and
  assigns roles in the Supabase dashboard.
- Opening a record (including a child's details) is not logged; only changes are.
- Staff who finish the second step stay signed in until the session ends; shorten session lifetime in the
  Supabase dashboard if you want stricter rules.
- If you add new tables later, give them explicit least-privilege grants: Supabase grants new tables to the
  public roles by default.
