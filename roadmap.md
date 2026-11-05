# F1 bundle integration

- [x] Inspect bundle instructions and PRD §§4.1–4.4, W1, 10.2, 10.4, 11.1.
- [x] Install supplied pages, controls, helpers, tests, and exact compatibility fixes.
- [x] Verify navigation, program filtering, enquiry validation and preview-only submissions for junior, adult and corporate programs.
- [x] Tests, scoped lint, preview build, desktop/mobile checks, unknown program 404.

# F2 patch

- [x] F2 patch installed (44 files); build passed; tests passed.
- [x] F2 page sweep (18 pages + event/news details) at 1440px and 390px: all load, correct titles, one heading each, no sideways scroll, no errors.

# Pre-F3 status

Done:
- [x] Lint cleaned (0 errors, 1 harmless warning). Auto-generated Supabase integration files restored to their original form.
- [x] Sample-content gate: `excludeSamples` in the data layer hides isSample programs, events, news and equipment on production builds (override: VITE_SHOW_SAMPLE_CONTENT="true"). Covered by sample-gate.test.ts.
- [x] Security scan (Oct 31 2026): 1 info finding — leaked-password protection is off (fix in Supabase Auth settings if staff logins are added). No tables yet.
- [x] Row-level access rules for the back-end tables are drafted below.

Open:
- [ ] Talent profile pages: no profiles yet, so untested until real profiles exist.
- [ ] Donation payment provider: awaiting client decision; giving stays preview-only.
- [ ] Real domain: awaiting client; VITE_SITE_URL still uses the lovable.app default.
- [ ] Client content: replace all sample programs/events/news/equipment, verified impact figures, contact details, legal wording.

# F3 polish (done)

- [x] F3 patch installed (43 files, images checksum-verified); 137 tests pass; build passed.
- [ ] Decision: approve sharp as a dev dependency for scripts/optimize-images.mjs.
- [ ] Re-measure page load speed on the deployed host (home and About still above 2.5 s in Claude's test).

# Back-end (B phases)

## B1 (installed 2026-11-04, switched off in production)
- [x] Draft SQL, public-key staging check script, no-secrets-in-.env test.
- [x] B1 patch installed (21 files): server functions + wiring for enquiry, contact, sponsor, pledge forms; 168 tests passed.
- [ ] Confirm the live database matches the reviewed SQL (run scripts/check-rls-staging.mjs against staging).
- [ ] Safeguarding intake stays off until the client names the Safeguarding Lead.

## B2 emails (installed 2026-11-05)
- [x] B2 patch installed (19 files): staff notification emails after save, email_log, retry route; 204 tests passed.
- [x] B2.1 installed (4 files): idempotency keys so retries never send duplicates; 210 tests passed; build passed.
- [ ] Set up Resend + sending domain; add STAFF_NOTIFY_EMAILS / SAFEGUARDING_EMAILS in host settings.
- [ ] Switch saving on (VITE_FORMS_MODE=save + FORMS_SAVING_ENABLED=true) once emails are verified end-to-end.
- [ ] Not yet tested against the real Resend service.

## Next phases (each needs approval)
- [ ] B3 staff login + admin inbox (turn on leaked-password protection first).
- [ ] B4 media library (Supabase Storage).
- [ ] B5 admin-managed programs/events/news.
- [ ] B6 donations (awaiting payment provider).
- [ ] B7 talent profiles with consent records.

- [ ] Remove the preview-only notices (`formsConnected`) only once each form saves its submission server-side; confirm to the user only after the save succeeds.
- [ ] Create the tables in the external Supabase with these rules (RLS on, no anon SELECT on any table):
  - enquiries, pledges, sponsor_enquiries: anon/public INSERT only through a server function with validation + honeypot; SELECT/UPDATE/DELETE staff-only (role checked via a user_roles table and a security-definer has_role function).
  - donations: no client writes at all; rows are created/updated only by the server after payment-provider verification; SELECT staff-only (finance role).
  - consent_records: no public access; INSERT/UPDATE by safeguarding staff only; SELECT limited to safeguarding staff; never exposed through public talent queries (public view uses only toPublicTalent fields).

## Interim photos
- [x] 8 client-supplied stock golf photos wired in (home, about, youth, programs, news), labelled "Placeholder image", kept out of gallery/impact/events.
- [ ] B-phase/admin: replace `src/lib/content/photos.ts` with the admin media library on Supabase Storage (PRD 7.7) so staff upload, crop (focal point), caption and swap photos.
