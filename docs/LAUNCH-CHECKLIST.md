# Launch checklist (from the code, as of F3)

Items below are open in the code today. Nothing here has been supplied by the client yet.

## Content the client must supply
- [ ] Contact details: email, phone, WhatsApp, address (`site.contact` in `src/lib/site.ts`)
- [ ] Safeguarding Lead contact (`site.contact.safeguardingEmail`)
- [ ] Social profiles (`site.social`); added to the organization data automatically once set
- [ ] Founder/leadership and coach profiles with portraits (About)
- [ ] Verified impact figures with the date they apply to (Impact)
- [ ] Authentic photographs with rights records (Gallery, hero, cards)
- [ ] Real programs, events and news (sample items are hidden in production)
- [ ] Approved wording for each legal page (they are `noindex` until then)

## Configuration
- [ ] Final domain: set `VITE_SITE_URL`; add the `Sitemap:` line to `public/robots.txt`
- [ ] Never set `VITE_SHOW_SAMPLE_CONTENT=true` on the production site
- [ ] Cache and security headers for the chosen host
- [ ] Analytics decision (privacy-respecting option per PRD)

## Before going live
- [ ] Re-run Lighthouse on the deployed site (mobile)
- [ ] Submit `/sitemap.xml` to Google Search Console
- [ ] Check the share preview of the home page (image, title, description)
- [ ] Screen-reader pass on the donation and contact forms
- [ ] Back-end work (storing enquiries, donations, consent) is a separate, approved phase
