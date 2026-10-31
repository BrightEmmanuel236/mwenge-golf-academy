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
- [x] Row-level access rules for the F3 tables are drafted below.

Open:
- [ ] Talent profile pages: no profiles yet, so untested until real profiles exist.
- [ ] Donation payment provider: awaiting client decision; giving stays preview-only.
- [ ] Real domain: awaiting client; VITE_SITE_URL still uses the lovable.app default.
- [ ] Client content: replace all sample programs/events/news/equipment, verified impact figures, contact details, legal wording.

# F3 requirements

- [ ] Remove the preview-only notices (`formsConnected`) only once each form saves its submission server-side; confirm to the user only after the save succeeds.
- [ ] Create the tables in the external Supabase with these rules (RLS on, no anon SELECT on any table):
  - enquiries, pledges, sponsor_enquiries: anon/public INSERT only through a server function with validation + honeypot; SELECT/UPDATE/DELETE staff-only (role checked via a user_roles table and a security-definer has_role function).
  - donations: no client writes at all; rows are created/updated only by the server after payment-provider verification; SELECT staff-only (finance role).
  - consent_records: no public access; INSERT/UPDATE by safeguarding staff only; SELECT limited to safeguarding staff; never exposed through public talent queries (public view uses only toPublicTalent fields).
