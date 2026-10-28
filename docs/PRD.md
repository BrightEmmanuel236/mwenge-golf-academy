# Mwenge Golf Academy Website: Final Product Requirements Document

**Version:** 1.0 (authoritative baseline)
**Foundation:** Mwenge Golf Academy: PRD Preparation Document
**Labels:** **[ASSUMPTION]** working assumption · **[VERIFY]** requires external verification · **[CONFIRM]** genuine decision for the client (collected in Section 14)

---

## 1. Executive Summary and Product Vision

### 1.1 Summary
Mwenge Golf Academy is a grassroots golf and youth-development initiative in Uganda that identifies, trains, mentors and equips young golfers, and also offers professional training to juniors, adults and corporate clients. This document defines the website and administration platform that will serve as the academy's primary digital presence.

The platform has four jobs:
1. **Establish credibility** with families, institutions, sponsors and golf bodies.
2. **Convert interest into action**: training enquiries, donations, equipment pledges, sponsorship conversations.
3. **Tell the academy's story responsibly**, with strong photography and rigorous protection of minors.
4. **Let a small staff team run it** without developer involvement for routine work.

### 1.2 Vision
A website that feels like a commissioned institutional site for a serious sporting academy: calm, confident, photographic and precise. Not a template, and not a charity appeal page. Prestige and purpose carry equal weight: the beauty and discipline of golf, and the opportunity it opens for young Ugandans.

### 1.3 Experience principles
1. **Photography leads, words clarify.** Every major page is anchored by a deliberate image.
2. **Trust is designed in.** Real names, real numbers, clear policies, visible safeguarding, no unverifiable claims.
3. **One clear next step per page.** Each page has a single primary call to action.
4. **Fast on a mid-range phone.** Beauty is never bought with slow loading.
5. **Children are protected first.** Publication of anything about a minor is gated by consent and approval.
6. **Honest imagery.** Stock photography is never presented as evidence of what the academy has done.

### 1.4 Key product decisions (made in this document)
| Decision | Choice | Reason |
|---|---|---|
| Booking model | Booking *request* with staff confirmation | Real-time slot booking needs coach/venue data that does not exist yet |
| Public accounts | None at launch | Every public journey works as a guest; accounts add cost and risk without value |
| Donations | Online, one payment provider, purpose-directed | Highest-value transaction; training payments follow in Phase 2 |
| Talent sponsorship | General **Talent Development Fund**, not named-child sponsorship | Avoids sponsor-child contact, expectation and privacy risks |
| Content management | Custom admin built into the app on Supabase | Structured content keeps design consistent; a headless CMS adds cost without need |
| Language | English at launch | Multi-language is a Phase 3 option |
| Palette | Revised from the original suggestion (see Section 6) | Retains the forest/gold identity, adds an earth accent and accessible gold text tone |
| Analytics | Privacy-respecting, cookie-light | Reduces consent complexity and protects visitors |

---

## 2. Goals, Target Users and Success Metrics

### 2.1 Goals
| # | Goal | Outcome |
|---|---|---|
| G1 | Credibility | Institutions and parents can verify who the academy is and what it does |
| G2 | Training demand | Steady qualified enquiries across junior, adult and corporate programs |
| G3 | Support | Recurring flow of donations, pledges and sponsor conversations |
| G4 | Impact storytelling | Authentic, consented stories and verified figures |
| G5 | Operations | Enquiries, pledges and donations managed in one place with clear status and ownership |
| G6 | Safety | Zero publication of minors' content without valid consent |

### 2.2 Target users
| Audience | Primary need | Primary journey |
|---|---|---|
| Parents/guardians | Trust, safety, cost, how to enrol | Youth page → Programs → Enquire |
| Aspiring adult golfers | Program choice and start date | Programs → Enquire |
| Corporate clients | Team events, executive coaching | Programs (Corporate) → Enquire |
| Individual donors | Confidence about where money goes | Support → Donate |
| Equipment supporters (clubs, individuals, companies, diaspora) | A clear needs list and process | Equipment → Pledge |
| Sponsors and partners | Credibility, reach, opportunities | Partners → Sponsor enquiry |
| Schools and community organizations | Outreach partnership | Youth/Events → Contact |
| Golf bodies and media | Facts, contacts, media assets | About / News / Contact |
| Academy staff | Fast daily management | Admin dashboard |

### 2.3 Success metrics
Targets are initial **[ASSUMPTION]** values to be baselined three months after launch.

| Metric | Target |
|---|---|
| Median enquiry first response time | ≤ 1 business day |
| Enquiry form completion rate (started → submitted) | ≥ 60% |
| Donation checkout completion (started → paid) | ≥ 50% |
| Core Web Vitals "Good" on mobile (LCP < 2.5s, CLS < 0.1, INP < 200ms) | ≥ 75% of page views |
| Lighthouse Accessibility score | ≥ 95 on all templates |
| Minors' content published without recorded consent | 0 |
| Content freshness: news or event update | At least 2 per month |
| Pledge-to-acknowledgement time | ≤ 3 business days |

---

## 3. Final Sitemap and Navigation

### 3.1 Sitemap
```
/                           Home
/about                      About the Academy (story, leadership, coaches, safeguarding)
/programs                   Programs & Training
  /programs/[slug]          Program detail + enquiry
/youth-development          Junior & Youth Development
/impact                     Talent & Impact
  /impact/talents/[slug]    Talent profile (consent-gated)
/events                     Events & Outreach
  /events/[slug]            Event detail
/support                    Support the Academy (hub)
  /support/donate           Donate
  /support/donate/thank-you Confirmation
  /support/equipment        Equipment Donations
  /support/sponsor          Sponsor & partner enquiry
/partners                   Sponsors & Partners
/gallery                    Gallery
/news                       News & Updates
  /news/[slug]              Article
/contact                    Contact
/legal/privacy              Privacy Policy
/legal/terms                Terms of Use
/legal/safeguarding         Safeguarding & Child Protection
/legal/cookies              Cookie & Analytics Notice
/legal/donation-terms       Donation & Refund Terms
/404, /500                  Branded error pages
/admin/*                    Administration (authenticated)
```

### 3.2 Primary navigation
Header (left to right): Logo · **About · Programs · Youth Development · Impact · Events & Outreach · Media** (dropdown: News, Gallery) **· Contact** · [**Support Us** dropdown: Donate, Pledge Equipment, Sponsor & Partner] · [**Book Training** button].

- "Book Training" is the persistent primary CTA (solid gold). "Support Us" is the secondary CTA (outlined).
- Mobile: full-screen menu, large touch targets; "Book Training" and "Support Us" pinned at the top of the menu and as a sticky bottom bar on program and youth pages only.
- Footer: mission line, quick links, Partners, Gallery, legal pages, safeguarding link, contact details, social links, newsletter placeholder (Phase 2).

### 3.3 Primary calls to action
| CTA | Destination |
|---|---|
| Book Training | /programs (or the program's enquiry form) |
| Donate | /support/donate |
| Pledge Equipment | /support/equipment |
| Become a Partner | /support/sponsor |
| Contact the Academy | /contact |

---

## 4. Page-by-Page Requirements

Each page has: **Purpose · Content sections · Imagery · Primary CTA · Data source**. All published content comes from the admin system unless marked static.

### 4.1 Home
- **Purpose:** Establish prestige and mission in ten seconds; route visitors.
- **Sections:** (1) Full-bleed hero with headline, one-line mission, two CTAs; (2) mission statement strip with three verified impact figures; (3) Program pathways (Junior, Adult, Corporate cards); (4) Youth development feature (editorial image + text); (5) Impact highlight (consented talent or outreach story); (6) Upcoming event; (7) Support band (Donate / Equipment / Partner); (8) Partner logo row; (9) Latest news (3 items); (10) Closing CTA.
- **Imagery:** Hero uses the strongest course/learner photograph available. Impact highlight uses only authentic academy imagery.
- **Primary CTA:** Book Training. **Data:** programs, impact figures, events, news, partners.
- Impact figures appear only if marked "verified" in admin; otherwise the strip is hidden.

### 4.2 About the Academy
- **Sections:** Story and mission; values; founder/leadership profiles; coaches (name, role, qualification, photo); governance/registration information (**[CONFIRM]** legal status); safeguarding commitment summary with link; milestones timeline.
- **Imagery:** Portrait photography of leadership and coaches in consistent crop; one wide course image at top.
- **Primary CTA:** Contact. **Data:** staff profiles, milestones, page content.

### 4.3 Programs & Training
- **List page:** Filter by audience (Junior, Adult, Corporate). Program cards: image, title, audience, level, duration, price from (UGX with USD shown), "View program".
- **Detail page:** Overview, who it is for, what is covered, schedule pattern, venue, coach(es), price and what it includes, FAQs, safeguarding note for junior programs, **enquiry form**.
- **Imagery:** 3:2 card thumbnails, 16:9 detail header, gallery strip of 3–5 supporting images.
- **Primary CTA:** Send enquiry. **Data:** programs, coaches.
- Prices are displayed only if entered; otherwise "Contact us for pricing".

### 4.4 Junior & Youth Development
- **Sections:** Development pathway (stages from introduction to competition) as a visual progression; school and community outreach; what parents can expect; safeguarding and coach vetting statement **[CONFIRM]** content; how talent is identified; link to Junior programs; parent FAQ.
- **Imagery:** Authentic academy photography preferred; if unavailable at launch, use licensed imagery carrying a visible "Illustrative image" caption (see Section 7.6).
- **Primary CTA:** Enquire about Junior programs.

### 4.5 Impact (Talent & Impact Showcase)
- **Sections:** Verified impact figures (children trained, schools reached, events held, with "as at" date); outreach stories; talent profile grid (consented only); achievements timeline.
- **Rules:** Only authentic academy images appear on this page; **no stock photography**. If fewer than three consented profiles exist at launch, show the stories and figures section and hide the profile grid.
- **Talent profile page:** Display name (first name and initial or agreed alias), age band, how they joined, achievements, short story, photograph (if consented). No school, home location, contact details or full name unless the guardian explicitly consents and the Safeguarding Lead approves.
- **Primary CTA:** Support Talent Development (Donate with purpose pre-selected).

### 4.6 Events & Outreach
- **List:** Upcoming first, then past, filter by type (Tournament, Outreach, Clinic, Fundraiser). **Detail:** date, venue, description, schedule, registration or enquiry link (informational in Phase 1), post-event summary and approved photos.
- **Imagery:** 16:9 detail header; event cards 3:2.
- **Primary CTA:** Enquire about the event / Contact.

### 4.7 Support the Academy (hub)
- Explains the three ways to help, what each makes possible (as concrete, verifiable examples; no invented cost figures), and transparency commitments. Three large cards: Donate, Pledge Equipment, Become a Partner.
- **Primary CTA:** Donate.

### 4.8 Donate
- **Content:** Purpose selector (Talent Development Fund, Equipment Fund, Outreach Fund, Where Most Needed); amount presets and custom amount; currency toggle (UGX/USD); donor details (name, email, optional phone, country); optional message; "Donate anonymously" and "Recognise me publicly" checkboxes; consent to receive updates (unchecked by default); checkout via payment provider.
- **Behaviour:** See workflow W2. Thank-you page and email receipt.
- **Imagery:** One calm editorial image; no images of identifiable children on the donation form.

### 4.9 Equipment Donations
- **Content:** Published needs list (item, quantity needed, priority, accepted condition); how pledges work in four steps; shipping/handling guidance; pledge form (organization or individual, items, quantities, condition, origin country, who ships, timing, notes, recognition preference).
- **Primary CTA:** Pledge equipment. **Data:** equipment needs.
- Banner: "Please pledge before shipping. We confirm what we can receive." **[VERIFY]** customs and duty guidance before publishing any shipping instructions.

### 4.10 Sponsors & Partners
- **Content:** Current partners (logo, name, link, short description); partnership opportunities (event sponsorship, program sponsorship, equipment partnership, corporate training partnership); enquiry form.
- Partner logos appear only with written permission. Logos are displayed in a consistent monochrome-to-colour hover treatment.

### 4.11 Gallery
- **Content:** Album grid by event or theme; masonry or uniform grid with lightbox; captions and credits; filter by category.
- **Rules:** Photos showing minors appear only if flagged consented. Albums show a source label in admin (Academy / Licensed / Placeholder); licensed or placeholder images are never placed in event albums.
- **Video:** Embedded via privacy-enhanced player with click-to-load facade.

### 4.12 News & Updates
- **List:** Featured article plus grid; categories; pagination. **Article:** headline, date, author, hero image, rich text, related articles, share links.
- **Data:** news posts. Scheduled publishing supported.

### 4.13 Contact
- **Content:** Form (name, email, phone optional, topic, message); direct channels (phone, WhatsApp, email, address, map embed or static map image, office hours); social links; safeguarding concern contact line (separate, clearly labelled).
- Staff are notified instantly; sender receives a confirmation.

### 4.14 Legal and system pages
Privacy, Terms, Safeguarding, Cookies/Analytics, Donation Terms: editable text via admin. **[CONFIRM]** supply of approved wording (Section 14). Branded 404/500 pages with navigation back to key pages.

---

## 5. User Journeys and Functional Workflows

All forms: server-side validation, bot protection, rate limiting, data persisted before email is sent, human-readable reference number (e.g., `MGA-ENQ-2026-0042`), staff notification, sender confirmation, and an admin record with status and timestamps.

### W1. Training enquiry / booking request
1. Visitor opens a program and completes the form: name, email, phone, audience type, preferred start period, message. For junior programs: parent/guardian name, relationship, child's first name, age, and a consent checkbox confirming the guardian is submitting.
2. System validates, stores the enquiry (status **New**), emails the enquirer and the staff group.
3. Staff open the enquiry in admin, assign an owner, and set status: **Contacted → Confirmed / Waitlisted / Declined / Closed**. Notes are internal.
4. On confirmation, staff send details using an email template (dates, venue, price, payment instructions).
5. Unactioned enquiries older than 2 business days appear highlighted on the dashboard.

### W2. Donation and payment
1. Donor completes the donation form and is redirected to the payment provider's hosted checkout (or hosted iframe).
2. The system creates a **pending** Donation and Payment record with a unique reference **before** redirect.
3. On provider notification (webhook/IPN), the server verifies authenticity, then confirms status directly with the provider's API before marking **Paid**. Redirect return alone never marks a payment as paid.
4. On **Paid**: donor receives a receipt and thank-you email; staff are notified; donation appears in admin.
5. **Failed/abandoned:** status recorded; donor sees a clear retry option. A scheduled job re-checks pending payments older than 30 minutes.
6. Webhook handling is idempotent (repeated notifications do not create duplicates).
7. Refunds are handled manually through the provider dashboard and recorded in admin as **Refunded** with a note.
- **Phase 1 payment scope:** donations only. Training fees are paid after staff confirmation via instructions (mobile money/bank) and recorded manually; Phase 2 introduces payment links.
- **[VERIFY]** Provider eligibility, fees, supported methods (MTN, Airtel, Visa/Mastercard), settlement currency and times, and recurring support. **[CONFIRM]** account owner and settlement bank.

### W3. Equipment pledge
1. Pledger submits the form (items, quantities, condition, origin, shipping plan, recognition preference). Status **Submitted**.
2. Staff review against the needs list: **Accepted / Needs changes / Declined**. Acceptance triggers an acknowledgement email with receiving instructions.
3. Staff update status: **In transit → Received → Distributed** (optional), with notes and dates.
4. Pledger receives an email at Accepted and Received. Recognition on the website only if the pledger opted in and staff approve.

### W4. Sponsorship and partnership
1. Visitor submits the sponsor enquiry (organization, contact, interest areas, message).
2. Staff follow up offline. Admin status: **New → In discussion → Agreed / Not proceeding**.
3. When **Agreed**, staff add the partner (logo with permission) and choose where it appears. No automatic publication.
- **Talent support:** sponsors support the **Talent Development Fund**. No named-child sponsorship in this release.

### W5. Talent profile management
1. Staff create a draft profile and upload photo(s).
2. Staff record the **Consent Record**: guardian name, relationship, date, scope (name display, photo, story, achievements), media types, expiry or review date, and attach the signed form (private storage).
3. The Safeguarding Lead reviews the draft against publication rules (no school, location, contact details; no unapproved identifiers) and approves.
4. The profile can only be published if a valid, unexpired consent record covering all included elements exists. The system enforces this.
5. **Withdrawal:** staff mark consent withdrawn → profile and linked media are unpublished immediately, search-index removal requested, cache revalidated; the Safeguarding Lead completes removal checks. Target: removal within 48 hours of the request **[ASSUMPTION]**.
6. Consents approaching expiry appear in a dashboard alert 30 days ahead.

### W6. Event and outreach management
Draft → add details, images → publish (revalidates the public pages) → after the event, add summary, figures and approved photos → archive automatically moves past events to "Past".

### W7. Content publishing (news, gallery, pages)
1. Content Manager drafts (rich text with a restricted editor; images via the media library with required alt text).
2. Preview exactly as it will render (draft preview link, authenticated).
3. Publish now or schedule. Publishing triggers cache revalidation for affected pages.
4. Content that includes minors (flagged at upload) requires Safeguarding Lead approval before publishing.

### W8. Administrative review
Dashboard shows, for the current user's permissions: new and overdue enquiries, pledges awaiting review, recent donations and failed payments, content awaiting approval, consent alerts. A weekly summary email goes to Admins. Monthly CSV exports are available for enquiries, donations and pledges.

### W9. Contact message
Form → stored → notification → status **New → Replied → Closed**.

### W10. Safeguarding concern
A dedicated contact route (email and form) delivers directly to the Safeguarding Lead and Super Administrator, bypasses the general inbox, and is logged restricted. **[CONFIRM]** the named lead and escalation procedure.

---

## 6. Design Direction and Design System

### 6.1 Concept
**"Fairway Heritage."** A deep-green, ivory and gold identity evoking the course and the club, warmed by one earth accent drawn from Uganda's red soil to signal youth and community. Editorial layouts, generous white space, large photography and restrained motion.

### 6.2 Colour palette
The original suggestion (forest, gold, cream, charcoal) is retained in spirit because it genuinely fits the sport and positioning, but refined for accessibility and a distinct Ugandan character.

| Role | Name | HEX | Use |
|---|---|---|---|
| Primary | Fairway Green | **#0E3B2C** | Header, footers, primary buttons, dark sections |
| Primary deep | Course Night | **#08261C** | Overlays, deepest backgrounds |
| Primary light | Canopy | **#1F6B4A** | Links on light backgrounds, hover, icons |
| Accent | Muted Gold | **#C9A24A** | CTA fills, rules, highlights, text on dark backgrounds |
| Accent text | Antique Gold | **#8A6A1F** | Gold-toned text on light backgrounds (meets contrast; **[VERIFY]** in build) |
| Secondary | Red Earth | **#B5532F** | Youth/impact highlights, small badges, sparingly (under 5% of any page) |
| Background | Ivory | **#FAF8F3** | Page background |
| Surface | White | **#FFFFFF** | Cards, forms |
| Surface alt | Sand | **#F0ECE2** | Alternate sections |
| Border | Stone | **#DDD7C8** | Dividers, input borders |
| Text | Ink | **#1B1F1D** | Body and headings on light |
| Text muted | Slate | **#4A524E** | Secondary text |
| Success | | **#1F7A4D** | Confirmations |
| Warning | | **#B7791F** | Alerts |
| Error | | **#B3261E** | Validation, failures |
| Info | | **#1F5F8B** | Notices |

**Rules:** Gold fills carry Fairway Green text (not white). Gold text on dark backgrounds uses Muted Gold; on light backgrounds only Antique Gold. Body text must achieve at least 4.5:1 contrast, large text 3:1. Never place text over photographs without a verified overlay.

### 6.3 Typography
| Role | Typeface | Notes |
|---|---|---|
| Display / headings | **Fraunces** (variable serif) | Gives the institutional, heritage tone; used for H1–H3 |
| Body and UI | **Inter** | Highly legible on mobile, strong numeral support for prices |
| Fallbacks | Georgia / system sans-serif | Metric-adjusted via `next/font`, self-hosted to avoid layout shift |

Scale (mobile → desktop): H1 36 → 64px, H2 28 → 44px, H3 22 → 30px, H4 18 → 22px, body 16 → 18px, small 14px. Line height 1.2 (headings) and 1.6 (body). Maximum text line length 70 characters. Overlines in uppercase Inter, 12–13px, letter-spacing 0.12em, Antique Gold or Muted Gold.

### 6.4 Layout, spacing, shape
- 8px spacing grid; section vertical padding 64px (mobile) / 112px (desktop).
- Container max width 1200px; wide editorial sections to 1440px; text columns 720px.
- 12-column grid desktop, 4-column mobile.
- Corner radius: 4px (inputs, buttons, cards): crisp and formal rather than pill-shaped. Images 2px or square.
- Borders: 1px Stone. Gold 2px rule as a signature accent beneath section overlines.
- Shadows: minimal, one soft level (`0 8px 24px rgba(8,38,28,0.08)`) for raised cards and menus.

### 6.5 Components and interaction
- **Buttons:** Primary (Gold fill, Green text), Secondary (Green outline), Dark (Green fill, ivory text), Text link with arrow. Minimum 48px touch height. Visible 3px focus ring (Gold on dark, Canopy on light).
- **Forms:** Visible labels (never placeholder-only), inline validation messages, clear required marking, success and error states, progress and disabled states during submit.
- **Cards:** Program, event, news, talent, partner, each with consistent image ratio and hover lift of 2px.
- **Alerts, badges, tabs, accordions (FAQ), dropdown nav, dialogs/lightbox, data tables** (admin) built on Shadcn UI primitives, themed with the tokens above.
- **Motion:** Subtle fades and 8–12px upward reveals (200–400ms), image scale 1.00 → 1.03 on hover, no parallax or autoplay carousels, **`prefers-reduced-motion` respected** (all motion disabled).

### 6.6 Iconography and supporting assets
Lucide icon set at 1.5px stroke, consistent size; a custom monoline golf motif set (flag, tee, ball, fairway line) created for section dividers and empty states; the logo supplied by the client (**[CONFIRM]**, redrawn as SVG if only raster exists). A wordmark lock-up is specified for header (light and dark variants), footer, favicon and social cards.

### 6.7 Responsive behaviour
Breakpoints: 360 (min supported), 640, 768, 1024, 1280, 1536. Mobile-first. Navigation collapses below 1024. Tables in admin become stacked cards below 768. No horizontal scroll at any width.

### 6.8 Accessibility principles (design level)
Colour never the sole signifier; focus order logical; minimum 16px body text; touch targets ≥ 44px; all images have meaningful alt text or are marked decorative; text resizes to 200% without loss.

### 6.9 Admin interface design
Same tokens and components in a denser layout: left sidebar navigation (Green), top bar with search and user menu, ivory content area, data tables with filters, status badges using the semantic colours, consistent form layouts, breadcrumbs, confirmation dialogs for destructive actions, and unmistakable "Published / Draft / Needs approval" states.

---

## 7. Photography, Image Optimization and Media Delivery

### 7.1 Photographic storytelling strategy
Narrative arc across the site: **landscape (the sport) → learner (the opportunity) → coach (the guidance) → community (the impact) → partnership (the future).**

| Theme | Where used | Treatment |
|---|---|---|
| Courses and landscapes | Home hero, About header, section breaks | Wide, golden-hour or morning light, generous sky/fairway negative space for text |
| Young golfers learning | Youth, Programs (Junior), Impact | Focus on posture, concentration, equipment, with dignity, never staged poverty or pity framing |
| Coaches mentoring | About, Programs detail | Close, human, eye-level framing |
| Equipment and practice | Programs, Equipment page | Detail and texture, shallow depth of field |
| Competitions and events | Events, Gallery | Documentary action and group moments |
| Outreach and schools | Youth, Impact, Events | Authentic, respectful, consent-verified |
| Sponsors and supporters | Partners, News | Event handshake/presentation photography with permission |

**Direction:** natural light; warm greens and earth tones; consistent colour grade; dignity-first portrayal of children; faces shown only with consent; avoid overly staged stock clichés.

### 7.2 Image roles, ratios and crops
| Placement | Role | Desktop ratio | Mobile ratio | Behaviour |
|---|---|---|---|---|
| Home hero | Full-width hero | 16:9 (max 80vh) | 4:5 art-directed crop | Priority load; focal point stored per image; Course Night gradient overlay 0%→65% from bottom for text |
| Page headers | Wide banner | 21:9 | 16:10 | Gradient overlay when text sits over image |
| Editorial feature | Image beside text | 4:5 or 3:2 | 3:2 | Never cropped through faces |
| Program/event/news cards | Thumbnail | 3:2 | 3:2 | `object-fit: cover` with focal point |
| Talent card | Portrait | 4:5 | 4:5 | Face-aware focal point, always consent-gated |
| Coach/leadership | Portrait | 1:1 or 4:5 | same | Consistent crop across set |
| Gallery grid | Thumbnail | 4:3 uniform grid (masonry optional) | 1:1 two-column | Opens lightbox with full-size view |
| Partner logos | Logo | Contained (no crop) | Contained | Monochrome default, colour on hover/focus |
| Video poster | Poster frame | 16:9 | 16:9 | Click-to-load embed |
| Social sharing (OG) | Share card | 1200×630 | n/a | Generated per page with fallback |

Every image record stores a **focal point** (x, y) so crops adapt to each ratio. Text over imagery always uses a verified gradient or scrim.

### 7.3 Image performance strategy
- **Pipeline:** Originals uploaded by staff (JPEG/PNG/HEIC up to 25MB) are stored in Supabase Storage. The admin upload step normalizes to a maximum 3000px longest edge, strips location metadata (EXIF GPS), and records dimensions.
- **Delivery:** `next/image` serves responsive `srcset` variants in **AVIF with WebP fallback** (JPEG fallback where unsupported), using Vercel's image optimization with long cache lifetimes and immutable file names (content hash). **[VERIFY]** Vercel plan limits for image optimization and cost at expected volume; fall back to Supabase image transformations or a dedicated image CDN if limits apply.
- **Sizes:** Correct `sizes` attributes per layout so mobile never receives desktop-width images.
- **Loading:** Hero image `priority` with `fetchpriority="high"` and preloaded; all other images lazy-loaded; gallery thumbnails lazy with low-quality blur placeholders (base64 blur stored at upload).
- **Layout stability:** Width and height or aspect-ratio always declared; zero image-caused layout shift.
- **Quality:** Quality 78 default for AVIF/WebP, 85 for hero and portrait images; subjective check on hero images before launch.
- **Budgets:** Hero ≤ 180KB on mobile (AVIF), ≤ 350KB desktop; card thumbnails ≤ 40KB; initial mobile page weight ≤ 1.5MB; originals never served to browsers except through an explicit "Download original" action for press assets (Phase 2).
- **Video:** No autoplay hero video at launch. Embeds use facade with poster image and the privacy-enhanced player domain. **[ASSUMPTION]** videos are hosted externally on YouTube or Vimeo.
- **Accessibility:** Alt text mandatory at upload (can be marked "decorative" with justification); captions and credits fields.
- **Caching:** Immutable cache headers for processed images; revalidation on replacement uses a new file name.

### 7.4 Storage structure
| Bucket | Access | Contents |
|---|---|---|
| `media-public` | Public read | Approved published images and documents |
| `media-originals` | Private | Original uploads before processing |
| `consent-documents` | Private, signed URLs, restricted roles | Signed consent forms |
| `partner-assets` | Public read | Logos |

Files are named by random identifiers, never by a child's name. Deleting a media record removes derived files and purges cache.

### 7.5 Media metadata (required fields)
Title, alt text, caption, credit, **source** (Academy / Licensed / Placeholder), licence reference (for Licensed), date taken, event link, `contains_minors` flag, consent reference (required when flagged), focal point, status.

### 7.6 Content and media strategy: academy, stock and replacement
1. **Academy-supplied photography is the target.** A launch photography brief is provided in Section 14 and a one-day commissioned shoot is recommended **[CONFIRM]**.
2. **Licensed stock** may be used for atmosphere only (landscapes, generic equipment, hero backgrounds). Licences and terms are recorded in the media library.
3. **Stock is never used in** Impact, Talent profiles, Events and outreach reports, Gallery, News about real events, or anywhere implying a real academy activity.
4. **Labelling:** Where licensed imagery shows people on Youth or Programs pages, a visible caption reads "Illustrative image". The `source` field makes untagged substitution impossible.
5. **Replacement:** The admin shows a "Placeholder/Licensed images still in use" report so authentic images replace them over time. Launch checklist target: 100% of Impact, Events and Gallery images are Academy source.
6. **Rights:** Photographers' consent and usage rights for academy imagery are captured in the media record.

### 7.7 Safeguards for minors in media
- Every upload flagged `contains_minors` cannot be published without a linked, valid consent record and Safeguarding Lead approval.
- No images that show a child's school name, uniform crest, home, or identifiable location without explicit approval.
- No captions with full names, schools or locations of minors unless consent specifically covers them.
- Appropriate attire and dignified depiction only; no images taken at moments of distress.
- **Removal process:** guardian requests removal by email, form or the safeguarding contact → staff log the request → media unpublished immediately → cache purged and revalidated → search-engine removal requested where applicable → written confirmation to the guardian. Target 48 hours **[ASSUMPTION]**.
- EXIF location data is stripped on upload.
- Staff using personal phones for academy photography are guided by the safeguarding policy **[CONFIRM]**.

---

## 8. Administration Roles and Permissions

### 8.1 Roles
| Role | Purpose | Notes |
|---|---|---|
| **Super Administrator** | Manages users, roles, settings, integrations | Two people maximum; mandatory MFA |
| **Academy Administrator** | Runs daily operations: enquiries, programs, donations, pledges, events, partners, talent | MFA required |
| **Content Manager** | Writes news, manages gallery and page copy | Cannot access donor details, enquiries with minors' data, consent records |
| **Safeguarding Lead** | Approves minors' content, holds consent records, manages removals | May be held by an Academy Administrator in Phase 1 **[CONFIRM]** |

No public roles. Parents, donors and sponsors are contact records, not account holders.

### 8.2 Permission matrix
R = read · W = create/edit · P = publish · A = approve · D = delete · X = export

| Area | Super Admin | Academy Admin | Content Manager | Safeguarding Lead |
|---|---|---|---|---|
| Users and roles | RWD | no | no | no |
| Site settings, integrations | RW | R | no | no |
| Enquiries and contact messages | RWX | RWX | no | R |
| Programs and coaches | RWP | RWP | R | R |
| Donations and payments | RX | RX | no | no |
| Equipment needs and pledges | RW | RW | no | R |
| Sponsors and partners | RWP | RWP | R | R |
| Events | RWP | RWP | RW (draft) | R |
| News | RWP | RWP | RWP | R |
| Gallery and media | RWP | RWP | RW (publish only non-minor media) | RAP |
| Talent profiles | RW | RW (draft) | no | RAP |
| Consent records | R | R (create) | no | RWA |
| Audit log | R | R (own area) | no | R (safeguarding) |

### 8.3 Admin behaviours
- Invitation-only accounts; email verification; MFA enrolment required on first login for Super Admin, Academy Admin and Safeguarding Lead.
- Session timeout after 60 minutes idle **[ASSUMPTION]**; re-authentication for destructive actions.
- Soft delete with 30-day recovery for content; hard delete only by Super Admin.
- Every create, update, delete, publish, approval, export and login event is written to the audit log (actor, action, entity, timestamp, before/after summary).
- Admin screens: Dashboard, Enquiries, Programs, Donations, Equipment (Needs, Pledges), Partners, Events, News, Gallery/Media, Talent, Consent, Pages and Settings, Users, Audit Log.

---

## 9. Data Model and System Architecture

### 9.1 Architecture decision
The proposed stack is retained: it suits a content-led site with forms, payments and an admin area, offers a managed Postgres with row-level security, and minimizes operations burden.

| Layer | Choice | Responsibility |
|---|---|---|
| Frontend | **Next.js (App Router), React, TypeScript** | Public site (statically generated with on-demand revalidation), admin UI, server actions and route handlers |
| Styling/UI | **Tailwind CSS + Shadcn UI** (Radix primitives) | Design tokens and accessible components |
| Database | **Supabase Postgres** with Row Level Security | System of record |
| Authentication | **Supabase Auth** (email + password + TOTP MFA) | Staff authentication only |
| Storage | **Supabase Storage** | Media and consent documents (Section 7.4) |
| Server logic | Next.js server actions and route handlers; Supabase Edge Functions or Vercel cron for scheduled jobs | Validation, payments, notifications, jobs |
| Email | Transactional provider (**Resend** or equivalent) with authenticated domain (SPF, DKIM, DMARC) | Confirmations, notifications, receipts |
| Payments | Provider-agnostic payment service; first candidate **Pesapal**, alternative **Flutterwave** | Hosted checkout, verified webhooks |
| Hosting | **Vercel** | Edge delivery, preview deployments, image optimization |
| Monitoring | Error monitoring (e.g., Sentry), uptime checks, log drains | Reliability |
| Bot protection | Cloudflare Turnstile (or equivalent) | Public forms |
| Rate limiting | Edge/middleware rate limiting backed by a key-value store | Public endpoints |
| Analytics | Privacy-respecting analytics (e.g., Plausible or Vercel Analytics) + Google Search Console | Section 11 |

**Payment provider selection:** The payment layer is an interface (`createCheckout`, `verifyTransaction`, `handleWebhook`) so either provider can be implemented without changing the product. Provider choice is made once **[VERIFY]** eligibility, fees and supported methods for the academy's legal entity are confirmed; no eligibility or cost is assumed here.

**Rendering strategy:** Public pages are statically generated and revalidated on publish; forms and payment pages are dynamic; admin is fully dynamic and never indexed or cached.

**Content management decision:** Structured content in Postgres edited through the in-app admin. Rich text is limited to a controlled editor (headings, lists, links, quotes, images from the media library). No free-form page builder, to preserve design consistency.

**Environments:** Local, Preview (per branch), Staging (separate Supabase project and sandbox payment keys), Production. Staging uses no real personal data.

### 9.2 Data entities
Common fields on all tables: `id` (UUID), `created_at`, `updated_at`, `created_by` where relevant. Status fields are constrained enumerations.

| Entity | Key fields | Relationships | Validation rules |
|---|---|---|---|
| `staff_profile` | auth user id, name, role, mfa_enabled, active | 1:1 with Supabase auth user | Role from allowed list; at most two super admins |
| `contact_person` | name, email, phone, country, marketing_opt_in | Linked to enquiries, donations, pledges, messages | Email format; phone normalized; de-duplicated by email |
| `program` | slug, title, audience, summary, body, level, duration, schedule_pattern, venue, price_ugx, price_usd, image_id, status, sort_order | Many coaches; has enquiries | Slug unique; price ≥ 0 or null; publish requires image and summary |
| `coach` | name, role, bio, qualifications, photo_id, status | Many programs | Photo and bio required to publish |
| `enquiry` | reference, program_id, contact_person_id, audience_type, preferred_start, message, guardian fields, child_first_name, child_age, status, owner_id, internal_notes | Program, contact person | Child fields required for junior audience; age 4–17 range check; guardian declaration required |
| `donation` | reference, contact_person_id, purpose, amount, currency, display_preference (anonymous/public), message, status | Payment, contact person | Min amount UGX 10,000 / USD 5 **[ASSUMPTION]**; currency UGX or USD |
| `payment` | provider, provider_reference, donation_id or enquiry_id, amount, currency, status, raw_event_log, verified_at | Donation | Unique provider reference; status transitions validated; amount and currency must match the donation on verification |
| `equipment_need` | item, description, quantity_needed, priority, accepted_condition, active | Many pledge items | Quantity > 0 |
| `equipment_pledge` | reference, contact_person_id, organization, origin_country, shipping_plan, expected_date, recognition_opt_in, status, notes | Pledge items, contact person | At least one item |
| `equipment_pledge_item` | pledge_id, need_id (nullable), description, quantity, condition | Pledge, need | Quantity > 0 |
| `sponsor_enquiry` | contact_person_id, organization, interests, message, status, owner_id | Contact person | Required organization name |
| `partner` | name, type, logo_id, website, description, permission_confirmed, display_order, status | Optional sponsor enquiry | Publish requires `permission_confirmed` |
| `talent_profile` | slug, display_name, age_band, story, achievements, photo_id, status, approved_by, approved_at | Consent record, events, media | **Publish blocked unless valid consent exists**; age band not exact age; no free-text field accepts contact details (pattern check) |
| `consent_record` | talent_profile_id or media_id, guardian_name, relationship, scope (flags), signed_date, expiry_date, document_path, withdrawn_at, recorded_by | Talent profile, media | Document required; expiry after signed date; withdrawn disables linked publications |
| `event` | slug, title, type, start_at, end_at, venue, description, summary, registration_url, status | Media, talent profiles | End after start; publish requires image |
| `media_asset` | storage_path, alt_text, caption, credit, source, license_ref, contains_minors, consent_id, focal_x, focal_y, width, height, blur_data, status | Event, news, program, talent | Alt text required; `source = Licensed` requires `license_ref`; `contains_minors` requires consent link to publish |
| `news_post` | slug, title, excerpt, body, hero_media_id, author_id, category, published_at, status | Media, staff | Slug unique; scheduled date in future |
| `contact_message` | reference, contact_person_id, topic, message, status | Contact person | Message length limits |
| `impact_figure` | label, value, as_at_date, verified, source_note, display_order | none | Only `verified` figures render |
| `page_content` / `site_setting` | key, content/value, updated_by | none | Whitelisted keys |
| `email_log` | template, recipient, related_entity, status, provider_id | Entities | No bodies stored for sensitive templates |
| `audit_log` | actor_id, action, entity_type, entity_id, summary, ip_hash, timestamp | All | Append-only |

### 9.3 Data integrity and access rules
- **Row Level Security** is enabled on every table. Public clients can only read published records through server-side queries and cannot read personal data tables.
- Public writes (forms) occur only through server route handlers using validated inputs; the service role key is used server-side only.
- Foreign keys enforced; enumerations constrained in the database as well as in application code.
- Payment status transitions are enforced in a single server module (`pending → paid | failed | cancelled | refunded`).

---

## 10. Security, Privacy, Safeguarding and Accessibility Requirements

### 10.1 Security
| ID | Requirement |
|---|---|
| SEC-1 | HTTPS everywhere, HSTS, secure and HTTP-only cookies |
| SEC-2 | Security headers: Content-Security-Policy, X-Content-Type-Options, Referrer-Policy, frame protections |
| SEC-3 | All validation repeated server-side using schema validation (e.g., Zod); client validation is for usability only |
| SEC-4 | Secrets only in environment variables on Vercel and Supabase, never in client bundles; separate secrets per environment |
| SEC-5 | Supabase service role key and payment secret keys used only in server code |
| SEC-6 | Bot protection and per-IP and per-email rate limiting on all public forms and auth endpoints |
| SEC-7 | Webhook signature/authenticity verification plus direct transaction verification with the provider before confirming payment; idempotency keys |
| SEC-8 | No card or mobile money PINs processed or stored by the platform; hosted checkout only |
| SEC-9 | Admin: MFA for privileged roles, strong passwords, lockout and notification on repeated failures |
| SEC-10 | RLS on all tables; least-privilege database roles; private storage buckets for consent and originals with short-lived signed URLs |
| SEC-11 | Output encoding and sanitization for rich text; file upload type and size validation and malware scanning where available |
| SEC-12 | Dependency updates monitored; automated vulnerability alerts; lockfile committed |
| SEC-13 | Audit logging of sensitive actions (Section 8.3) |
| SEC-14 | Admin routes `noindex`, excluded from caching |
| SEC-15 | Prelaunch security review and a payment-flow test in sandbox |

### 10.2 Privacy and data protection
- Collect only what is needed. Child data limited to first name and age band for enquiries; no child email or phone numbers collected.
- Privacy notice at every form's point of collection; explicit consent checkboxes (unticked) for marketing communications.
- Role-based access: Content Managers cannot see personal data.
- **Retention:** defined schedule **[CONFIRM]** (suggested: unfulfilled enquiries deleted or anonymized after 24 months; consent records retained for the duration plus a defined period).
- Data subject requests (access, correction, deletion) handled via a documented admin procedure.
- Analytics avoid cross-site tracking and personal identifiers.
- **[VERIFY]** Ugandan data protection obligations and any registration requirements with qualified counsel; **[VERIFY]** obligations for international donors and visitors. No specific legal requirement is asserted in this document.

### 10.3 Safeguarding
- A published **Safeguarding & Child Protection** page summarizing the academy's policy and contact route **[CONFIRM]** policy existence and content.
- Named Safeguarding Lead and deputy; direct reporting route (W10).
- Consent-gating enforced in software (W5, Section 7.7), not left to staff memory.
- Talent and media rules: default to minimal identification; no location, school or contact detail; guardians can review before publication and withdraw at any time.
- No direct messaging, comments or user-generated content involving minors anywhere on the site.
- No sponsor access to children's contact details or named-child relationships.
- Staff briefing on these rules recorded as part of onboarding to admin access.

### 10.4 Accessibility
- Target **WCAG 2.1 AA** (aim for 2.2 AA where practical).
- Semantic HTML landmarks, logical headings, skip-to-content link.
- Full keyboard operability including nav menus, lightbox and forms; visible focus indicators.
- Programmatic labels and error associations for all form fields; error summary on submit failure.
- Contrast verified for all palette combinations (notably gold usage); no information by colour alone.
- Alt text policy (Section 7.3); captions for embedded video where available.
- Reduced motion respected; no content flashing.
- Testing: automated (axe, Lighthouse) in CI plus manual keyboard and screen-reader checks (NVDA/VoiceOver) on key flows prelaunch.

---

## 11. SEO, Analytics, Performance and Operational Requirements

### 11.1 SEO
- Unique title and meta description per page; descriptive URLs (Section 3); canonical tags.
- Open Graph and Twitter cards with page-specific images.
- Structured data: Organization / SportsOrganization, Event, Article (news), BreadcrumbList, Person (coaches, optional), FAQ where used.
- XML sitemap and robots rules (admin and thank-you pages excluded); Search Console set up.
- Heading hierarchy and descriptive internal links; image alt text.
- Clean redirects for any legacy URLs **[CONFIRM]** whether an existing site exists.
- Local relevance: consistent name, address, phone details; Google Business Profile recommended.
- Minors' profiles: `noindex` default for individual talent pages unless guardian consent explicitly includes search indexing **[ASSUMPTION]**; image URLs for minors are not exposed in sitemaps.
- Content plan: monthly news, event pages, program pages written for local search intents.

### 11.2 Analytics
- Privacy-respecting analytics with no advertising cookies at launch **[VERIFY]** whether a cookie notice is required for the chosen configuration.
- Tracked events: CTA clicks, enquiry started/submitted, donation started/paid/failed, pledge submitted, sponsor enquiry submitted, contact submitted, outbound social clicks, search queries (if search is added).
- Admin dashboard shows operational counts from the database (not browser analytics).
- Monthly report: traffic sources, top pages, conversion rates against Section 2.3.

### 11.3 Performance
| Metric | Budget |
|---|---|
| LCP (mobile, 4G, mid-range device) | < 2.5 s |
| CLS | < 0.1 |
| INP | < 200 ms |
| Initial JavaScript (public pages, gzip) | ≤ 200 KB |
| Initial mobile page weight | ≤ 1.5 MB |
| Fonts | Self-hosted, subsetted, `font-display: swap`, ≤ 2 families |
| Third-party scripts | Minimal, deferred; payment scripts only on payment pages |
Performance budgets are enforced in CI (Lighthouse CI) with failures blocking release. Consideration for lower-bandwidth conditions: server-rendered content, no blocking client rendering, resilient forms.

### 11.4 Reliability, backup and recovery
- **Backups:** Supabase automated daily database backups **[VERIFY]** plan retention and point-in-time recovery availability; additional weekly database export and storage bucket copy to separate storage owned by the academy.
- **Restore test:** performed before launch and quarterly.
- **Recovery targets** **[ASSUMPTION]**: recovery time ≤ 24 hours, maximum data loss ≤ 24 hours; tighten if point-in-time recovery is available.
- **Monitoring:** uptime check on home, forms and checkout; error monitoring with alerts; payment anomaly alert (pending payments not resolving, webhook failures).
- **Error handling:** branded error pages; form submissions never lost (stored before notification); retry for email failures (queued, logged); payment failures present clear retry; admin shows failed notifications.
- **Scalability:** designed for modest steady traffic with event-driven spikes handled through static delivery and CDN caching.

### 11.5 Maintainability and operations
- Code in a private repository; trunk-based development with pull requests; automated type-check, lint, unit tests, end-to-end tests and accessibility checks in CI.
- Database migrations version-controlled; no manual production schema changes.
- Environment configuration documented; one-page runbook for incidents (payment, email, outage, safeguarding removal).
- Admin user guide and a recorded training session for staff at handover.
- Support arrangement for post-launch period **[CONFIRM]** (suggested: 3 months of warranty and a monthly maintenance routine covering updates, backups verification, and monitoring review).
- Domain, DNS, hosting, Supabase and payment accounts owned by the academy (not the developer), with the developer added as collaborator.

### 11.6 Deployment
1. Provision production Supabase project and Vercel project; configure domain and DNS (SPF, DKIM, DMARC).
2. Configure environment variables and secrets; production payment keys installed only after sandbox verification.
3. Run migrations and seed required reference data (roles, enumerations, legal page shells).
4. Load launch content; verify Academy-source images and consent records.
5. Execute launch checklist (Section 13.8): functional, accessibility, performance, security, backup restore, payment live test with a small real transaction.
6. Go live; monitor for 72 hours; confirm analytics and Search Console.

---

## 12. Prioritized Delivery Phases

### Phase 1: Launch (production-ready)
- All public pages in Section 4 with the design system
- Image pipeline, media library and safeguarding gates
- Program catalogue and enquiry workflow (W1)
- Donations with one payment provider and receipts (W2)
- Equipment needs and pledges (W3); sponsor enquiries (W4); contact (W9, W10)
- Talent profiles with consent enforcement (W5), events, news, gallery
- Admin with four roles, audit log, dashboard, exports
- Email notifications, SEO foundation, analytics, backups, monitoring
- Legal and policy pages (with client-supplied content)

### Phase 2: Post-launch enhancement
- Payment links for confirmed training enquiries; manual-to-online reconciliation
- Recurring donations (provider permitting **[VERIFY]**)
- Event registration forms and attendee lists
- Program packages/memberships
- Newsletter integration
- Sponsor impact reports (generated PDF summaries)
- Press kit/media download area

### Phase 3: Future vision
- Real-time booking with coach and venue calendars
- Parent portal (attendance, progress, payments)
- Named-child sponsorship with safeguarding-reviewed policy and reporting
- Equipment inventory and distribution tracking
- Tournament and results management
- Multi-language (e.g., Luganda, Swahili), WhatsApp integrations, merchandise

Phase 3 items are not designed or built in Phase 1 beyond keeping the data model extensible.

---

## 13. Testable Acceptance Criteria

### 13.1 General
- AC-G1: All public pages render correctly at 360, 768, 1024 and 1440px widths without horizontal scrolling.
- AC-G2: Navigation, CTAs and footer match Section 3 on all pages.
- AC-G3: Every public page has a unique title, meta description and canonical URL.
- AC-G4: Branded 404 and 500 pages appear for unknown routes and server errors.

### 13.2 Enquiry and booking
- AC-E1: A valid enquiry creates a database record with reference number and status New, and sends confirmation to the enquirer and notification to staff.
- AC-E2: Junior enquiries cannot be submitted without guardian details and declaration.
- AC-E3: Invalid or malicious input is rejected server-side with a clear message and no record.
- AC-E4: Bot or rate-limit triggers block abuse without blocking normal users.
- AC-E5: Staff can change status, assign owner and add notes; all changes appear in the audit log.
- AC-E6: Enquiries not actioned within 2 business days are highlighted in the dashboard.

### 13.3 Payments and donations
- AC-P1: A donation is recorded as pending before redirect to checkout.
- AC-P2: A donation shows as Paid only after server-side verification with the provider confirms amount, currency and reference.
- AC-P3: Repeated webhook calls do not create duplicate payments or emails.
- AC-P4: Failed and abandoned payments are recorded and the donor can retry.
- AC-P5: A paid donation sends a receipt email and appears in admin with purpose and currency.
- AC-P6: Anonymous and public-recognition preferences are respected on every public surface.
- AC-P7: UGX and USD donations complete in sandbox for each enabled method; **[VERIFY]** live test with a small real transaction before launch.
- AC-P8: No payment secrets or privileged keys appear in client bundles or network responses.

### 13.4 Pledges, sponsors and contact
- AC-Q1: A pledge records at least one item and shows status progression through admin; emails send at Accepted and Received.
- AC-Q2: Sponsor enquiry and contact messages persist, notify staff and appear in admin.
- AC-Q3: A safeguarding concern submission reaches only the Safeguarding Lead and Super Administrator.

### 13.5 Talent, media and safeguarding
- AC-S1: A talent profile cannot be published without a valid, unexpired consent record covering the included elements.
- AC-S2: Marking consent as withdrawn unpublishes the profile and linked media within one minute and triggers cache revalidation.
- AC-S3: Media flagged `contains_minors` cannot be published without consent link and Safeguarding Lead approval.
- AC-S4: Media with source Licensed cannot be attached to Event, Gallery, or Impact content.
- AC-S5: Uploaded images have EXIF location data removed.
- AC-S6: Consent documents are inaccessible to unauthenticated users and to roles without permission.

### 13.6 Admin and permissions
- AC-A1: Each role can perform only the actions in Section 8.2 (verified by automated role tests, including direct API/RLS attempts).
- AC-A2: MFA is enforced for Super Admin, Academy Admin and Safeguarding Lead.
- AC-A3: All create, update, publish, approve, export and delete actions generate audit entries.
- AC-A4: Publishing news, events or programs updates the public page within 60 seconds.
- AC-A5: Draft preview works for authenticated staff only.

### 13.7 Performance, accessibility, SEO
- AC-N1: Home, a program page and a news article meet the Core Web Vitals budget on throttled mobile in Lighthouse (LCP < 2.5s, CLS < 0.1).
- AC-N2: Hero image on mobile ≤ 180 KB and served in AVIF or WebP; no image causes layout shift.
- AC-N3: Axe and Lighthouse accessibility scores ≥ 95; no critical axe violations on any template.
- AC-N4: All forms and menus operable with keyboard alone; focus visible.
- AC-N5: Contrast ratios meet WCAG AA for all token combinations in use.
- AC-N6: Sitemap, robots, structured data validate without errors.
- AC-N7: Admin pages return `noindex` and are not in the sitemap.

### 13.8 Launch checklist
- Backup restore test passed; monitoring and alerts verified.
- Legal and safeguarding pages published with approved text.
- All Impact, Events and Gallery images are Academy-source with documented rights.
- All consent records reviewed for published minors' content.
- Production payment live-tested; reconciliation process documented.
- Email domain authentication passing; test emails delivered to major providers.
- Staff trained; admin guide delivered; accounts owned by the academy.

### 13.9 Testing requirements
Unit tests for validation and payment state logic; integration tests for forms, webhooks and RLS; end-to-end tests for W1, W2, W3, W5 and W7; cross-browser (current Chrome, Safari, Firefox, Edge; iOS Safari and Android Chrome); real-device testing on at least one low-to-mid-range Android phone; usability walk-through with two parents and one staff member; security review before launch.

---

## 14. Assumptions, External Dependencies and Decisions Requiring Confirmation

### 14.1 Genuine decisions requiring client confirmation
| # | Decision | Why it matters |
|---|---|---|
| 1 | **Legal identity** of the academy (registered entity type) | Payment onboarding, donation terms, receipts, governance statement |
| 2 | **Payment account owner**, settlement bank and currencies | Required to activate any provider |
| 3 | **Safeguarding policy**: existence, content, named Safeguarding Lead and deputy, escalation route | Underpins all content involving minors |
| 4 | **Consent form** wording and who may sign for each participant | Required for W5 and media |
| 5 | **Training prices** and refund/cancellation terms | Needed for program pages and donation/training terms |
| 6 | **Enquiry response owner** and expected response time | Operational promise shown to the public |
| 7 | **Equipment logistics owner**: receiving, storage, distribution | Pledge workflow depends on it |
| 8 | **Founder/leadership positioning**, including how the client's public role is represented **[VERIFY]** any applicable rules | Brand and reputation |
| 9 | **Impact figures** with source and "as at" date | Credibility; only verified figures are shown |
| 10 | **Photography**: supply of authentic images or approval of a commissioned shoot | Image-led strategy depends on it |
| 11 | **Data retention periods** | Privacy notice and admin behaviour |
| 12 | Whether **recurring donations** and formal **donation receipts** are required at launch | Phase planning |
| 13 | **Domain, email and any existing website/URLs** | DNS, redirects, email deliverability |
| 14 | Post-launch **support and maintenance** arrangement | Operational continuity |

### 14.2 External verification required
- **[VERIFY]** Payment provider eligibility, fees, supported methods, settlement terms, recurring capability, and sandbox availability for the academy's entity.
- **[VERIFY]** Ugandan data-protection obligations, including any registration, and requirements for minors' data and imagery.
- **[VERIFY]** Fundraising/charitable-solicitation regulation and tax treatment/receipt requirements for donations.
- **[VERIFY]** Customs and duty handling for donated equipment before publishing shipping guidance.
- **[VERIFY]** Whether analytics configuration requires a cookie notice.
- **[VERIFY]** Supabase plan (backup retention, PITR, image transformations) and Vercel plan (image optimization limits, team seats, bandwidth) against expected usage and cost.
- **[VERIFY]** Email provider deliverability for Ugandan and international recipients.
- **[VERIFY]** Final colour contrast of gold-tone combinations in the built design.

### 14.3 Working assumptions
- **[ASSUMPTION]** English-only at launch.
- **[ASSUMPTION]** Minimum donation UGX 10,000 / USD 5.
- **[ASSUMPTION]** Removal of minors' content within 48 hours of a request.
- **[ASSUMPTION]** Individual talent pages are not search-indexed by default.
- **[ASSUMPTION]** Admin sessions time out after 60 minutes of inactivity.
- **[ASSUMPTION]** Recovery objectives of 24 hours (time and data) until backup capabilities are confirmed.
- **[ASSUMPTION]** Videos are hosted externally (YouTube/Vimeo).
- **[ASSUMPTION]** The academy owns all accounts and the developer holds delegated access.
- **[ASSUMPTION]** Success-metric targets are initial and will be rebaselined after three months.

### 14.4 Launch content dependencies (from the preparation document)
Logo (vector) and brand approval; academy description; leadership and coach profiles and photos; program descriptions, schedules, venues and prices; contact details; photography and video with rights; consented talent information; verified achievements and impact figures; partner logos with permission; donation purposes and bank/mobile details; equipment needs list; social accounts; legal, privacy and safeguarding documents; testimonials with permission.

### 14.5 Recommended photography brief for launch (one day)
Course establishing shots at golden hour; coach-and-learner sessions; junior group training (with signed consents in hand); equipment details; leadership and coach portraits in consistent crop; one outreach session at a school; an event or tournament if scheduled. Deliver minimum 60 selected images in original resolution with photographer release.

---

*This PRD is the authoritative baseline. Subsequent UX specifications, architecture documentation and engineering plans derive from it. Changes are managed through versioned amendments to this document.*
