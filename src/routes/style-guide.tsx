import { createFileRoute } from "@tanstack/react-router";
import type * as React from "react";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/layout/section-heading";
import { SmartImage, type ImageRole } from "@/components/media/smart-image";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { swatches } from "@/lib/design/swatches";


const imageRoles: { role: ImageRole; note: string; src: string }[] = [
  {
    role: "hero",
    note: "4:5 mobile, 16:9 desktop. Priority load.",
    src: "/placeholders/fairway-dawn.svg",
  },
  {
    role: "banner",
    note: "16:10 mobile, 21:9 desktop. Page headers.",
    src: "/placeholders/fairway-dawn.svg",
  },
  {
    role: "feature",
    note: "3:2 mobile, 4:5 desktop. Beside text.",
    src: "/placeholders/practice-green.svg",
  },
  {
    role: "card",
    note: "3:2. Program, event and news cards.",
    src: "/placeholders/clubs-detail.svg",
  },
  {
    role: "portrait",
    note: "4:5. Coaches and talent (consent-gated).",
    src: "/placeholders/practice-green.svg",
  },
  { role: "gallery", note: "1:1 mobile, 4:3 desktop.", src: "/placeholders/clubs-detail.svg" },
];

function Block({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="border-line border-t py-12 first:border-t-0">
      <h2 id={id} className="mb-8 text-3xl">
        {title}
      </h2>
      {children}
    </section>
  );
}

function StyleGuidePage() {
  return (
    <>
      <Section space="compact" tone="dark">
        <Container>
          <SectionHeading
            as="h1"
            onDark
            title="Design system"
            description="Foundation components for the Mwenge Golf Academy website. This page is internal and not indexed."
          />
        </Container>
      </Section>

      <Section space="compact">
        <Container>
          <Block id="colour" title="Colour">
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {swatches.map((swatch) => (
                <li
                  key={swatch.token}
                  className="border-line overflow-hidden rounded-md border bg-white"
                >
                  <div aria-hidden="true" className={`${swatch.bg} h-20`} />
                  <div className="p-4">
                    <p className="font-medium">{swatch.name}</p>
                    <p className="text-sm text-slate">{swatch.hex}</p>
                    <p className="text-slate text-sm">{swatch.use}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Block>

          <Block id="type" title="Typography">
            <div className="flex flex-col gap-6">
              <h1>Heading 1: the academy for young talent</h1>
              <h2>Heading 2: programs and training</h2>
              <h3>Heading 3: junior development pathway</h3>
              <h4>Heading 4: what parents can expect</h4>
              <p className="measure">
                Body text is set in Inter at 16 to 18 pixels with generous line height, and kept
                under 70 characters per line so it reads comfortably on a phone and on a desktop.
              </p>
              <p className="text-slate text-sm">Small text and supporting captions use Slate.</p>
            </div>
          </Block>

          <Block id="buttons" title="Buttons and links">
            <div className="flex flex-wrap items-center gap-4">
              <Button>Book Training</Button>
              <Button variant="secondary">Support Us</Button>
              <Button variant="dark">Send enquiry</Button>
              <Button variant="link" size="none">
                Read the full story
              </Button>
              <Button disabled>Disabled</Button>
            </div>
            <div
              data-surface="dark"
              className="bg-fairway mt-6 flex flex-wrap items-center gap-4 rounded-md p-6"
            >
              <Button>Book Training</Button>
              <Button variant="secondary-on-dark">Learn more</Button>
            </div>
          </Block>

          <Block id="forms" title="Form controls">
            <Alert tone="info" title="Demonstration only" className="mb-8">
              These fields show design and validation states. They do not submit or store anything.
            </Alert>
            <div className="grid gap-6 md:grid-cols-2">
              <Field id="sg-name" label="Full name" required>
                {(a11y) => <Input {...a11y} autoComplete="name" />}
              </Field>
              <Field
                id="sg-email"
                label="Email address"
                hint="We reply within one business day."
                required
              >
                {(a11y) => <Input {...a11y} type="email" autoComplete="email" />}
              </Field>
              <Field id="sg-phone" label="Phone number">
                {(a11y) => <Input {...a11y} type="tel" autoComplete="tel" />}
              </Field>
              <Field id="sg-topic" label="Topic" required>
                {(a11y) => (
                  <Select {...a11y} defaultValue="">
                    <option value="" disabled>
                      Choose a topic
                    </option>
                    <option>Training</option>
                    <option>Youth development</option>
                    <option>Partnership</option>
                  </Select>
                )}
              </Field>
              <Field
                id="sg-error"
                label="Field with an error"
                error="Enter a valid email address."
                required
              >
                {(a11y) => <Input {...a11y} defaultValue="not-an-email" />}
              </Field>
              <Field id="sg-message" label="Message" required className="md:col-span-2">
                {(a11y) => <Textarea {...a11y} />}
              </Field>
            </div>
          </Block>

          <Block id="feedback" title="Alerts and badges">
            <div className="grid gap-4 md:grid-cols-2">
              <Alert tone="success" title="Enquiry received">
                We have sent a confirmation to your email address.
              </Alert>
              <Alert tone="warning" title="Check the details">
                Some of the information needs your attention.
              </Alert>
              <Alert tone="danger" title="Payment did not complete">
                Your card was not charged. Try again or use another method.
              </Alert>
              <Alert tone="info" title="Good to know">
                Equipment pledges are confirmed before anything is shipped.
              </Alert>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Badge>Junior</Badge>
              <Badge variant="outline">Adult</Badge>
              <Badge variant="dark">Corporate</Badge>
              <Badge variant="earth">Youth impact</Badge>
            </div>
          </Block>

          <Block id="cards" title="Card">
            <div className="grid gap-6 md:grid-cols-3">
              {[
                "Junior program (sample)",
                "Adult program (sample)",
                "Corporate program (sample)",
              ].map((title, index) => (
                <Card key={title}>
                  <SmartImage
                    role="card"
                    source="placeholder"
                    src={
                      [
                        "/placeholders/practice-green.svg",
                        "/placeholders/fairway-dawn.svg",
                        "/placeholders/clubs-detail.svg",
                      ][index] ?? null
                    }
                    alt="Abstract placeholder illustration"
                  />
                  <CardBody>
                    <h3 className="text-xl">{title}</h3>
                    <p className="text-slate">
                      Sample card used to review image ratio, spacing and borders.
                    </p>
                  </CardBody>
                </Card>
              ))}
            </div>
          </Block>

          <Block id="images" title="Image roles">
            <p className="measure text-slate mb-8">
              Every image goes through one component that enforces alt text, reserves space to
              prevent layout shift, applies a focal point, and labels anything that is not authentic
              academy photography.
            </p>
            <div className="grid gap-8 md:grid-cols-2">
              {imageRoles.map(({ role, note, src }) => (
                <figure key={role} className="flex flex-col gap-3">
                  <SmartImage
                    role={role}
                    src={src}
                    source="placeholder"
                    alt="Abstract placeholder illustration"
                  />
                  <figcaption className="text-slate text-sm">
                    <span className="text-ink font-medium">{role}</span>: {note}
                  </figcaption>
                </figure>
              ))}
              <figure className="flex flex-col gap-3">
                <SmartImage
                  role="card"
                  src={null}
                  source="academy"
                  decorative
                  emptyLabel="Photography to be added"
                />
                <figcaption className="text-slate text-sm">
                  <span className="text-ink font-medium">empty state</span>: shown on Impact until
                  authentic photography exists.
                </figcaption>
              </figure>
              <figure className="flex flex-col gap-3">
                <SmartImage
                  role="card"
                  src="/placeholders/fairway-dawn.svg"
                  source="licensed"
                  alt="Abstract illustration of a fairway at dawn"
                />
                <figcaption className="text-slate text-sm">
                  <span className="text-ink font-medium">licensed</span>: carries a visible
                  &ldquo;Illustrative image&rdquo; label.
                </figcaption>
              </figure>
            </div>
          </Block>
        </Container>
      </Section>
    </>
  );
}

export const Route = createFileRoute("/style-guide")({
  head: () => ({
    meta: [
      { title: "Style guide | Mwenge Golf Academy" },
      { name: "description", content: "Design system and shared components for the Mwenge Golf Academy website." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Style guide | Mwenge Golf Academy" },
      { property: "og:description", content: "Design system and shared components for the Mwenge Golf Academy website." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StyleGuidePage,
});
