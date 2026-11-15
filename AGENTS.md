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
- Staff area (B3): `/admin`, never indexed, no public header/footer. Staff sign in with password + authenticator code; the database requires the second step (assurance level aal2) before any submission is readable, so screens only decide what to show. Staff code reads and writes only through the signed-in person's own session (no service key, no sign-up, no token storage of its own). The gate decides from the matched route, never the address. A save is only reported when the database changed a row. A child's details appear only on a junior enquiry's record page and are never emailed. New tables need explicit least-privilege grants.

## Working with Google AI Studio (frontend engine)
`CONTEXT.md` explains the workflow. Rules for any AI tool that edits this repo:

- Work on a branch named `ai/<short-name>` and open a pull request into `main`. Never push to `main`.
- You build frontend and feature code only: `src/components`, `src/routes`, non-server code in `src/lib`, `public/`, `docs/`.
- Do **not** change protected files (CI blocks them): `package.json`, lockfiles, `bunfig.toml`, `vite.config.ts`,
  `vitest.config.ts`, `tsconfig*.json`, `eslint.config.js`, `components.json`, `.env*`, `vercel.json`, `wrangler.*`,
  `.lovable/`, `.github/`, `supabase/`, `src/integrations/supabase/`. If one truly must change, stop and say why.
- Do not add or upgrade dependencies. If you need one, stop and say so in the pull request description.
- Never write SQL, migrations, access policies or edge functions. List what the feature needs from the database
  under "Database needs" in the pull request. Claude does that work and regenerates the types.
- No secrets, tokens or API keys anywhere in the code, and no calls to AI services from the app. Remove
  sandbox-specific files or settings your tool adds (for example anything holding a Gemini key).
- Reuse existing components, design tokens, `@/components/app-link` and the content layer. Keep strict TypeScript. No
  `localStorage` for tokens, no `dangerouslySetInnerHTML`, no sign-up or password-reset screens.
- Never import a `*.server.ts` file from browser code. Never reorder or weaken the staff-area gate or the
  rule that a save is only reported when the database confirmed it.
- Small pull requests, each with the template filled in. Run `bun run build` before pushing.
