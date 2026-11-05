<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Internal links go through `@/components/app-link` (href-based); add a path to its `builtRoutes` set when its route file exists, so unbuilt pages stay plain links until then.
- Colour tokens in `src/styles.css` stay hex: `src/test/mwenge/contrast.test.ts` parses them for WCAG checks.
- F1 public pages use the content-access layer and shared TanStack Query options. The four public forms (enquiry, contact, sponsor, pledge) save to Supabase only when `VITE_FORMS_MODE=save` (browser) and `FORMS_SAVING_ENABLED=true` (server) are both set; production leaves both unset and shows "Preview only". The donation form is always preview-only. A form must never show success unless the server confirmed the save (`src/lib/server/submit.server.ts`).
- Database SQL lives in `supabase/drafts/` until the owner approves applying it (apply to staging first). Public visitors never touch tables: forms go through `src/lib/submit.functions.ts` and the database's `submit_*` functions with the server-only service key. No secrets in `.env` or `VITE_*` variables.
- `docs/PRD.md` is the authoritative spec: read the relevant section before building any page, form or rule, and cite its section numbers, so work stays aligned with the client baseline.
- Emails (B2): sent only after a submission is saved, built from the saved record by reference (`get_submission_for_email`), recorded in `email_log` (no addresses or message text), retried via `/api/email-retry`. Recipient addresses come from host settings (`STAFF_NOTIFY_EMAILS`, `SAFEGUARDING_EMAILS`), never from code or git. A child's name, age or declaration must never appear in an email. Safeguarding concerns use their own server path and alert only the safeguarding addresses; that path stays off until the client names the lead.
