import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import Link from "@/components/app-link";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/layout/section-heading";
import { Button } from "@/components/ui/button";
import { purposeLabels } from "@/lib/content/pages";
import { donationPurposes } from "@/lib/schemas";
import { pageHead } from "@/lib/seo";
import { ErrorComponent, NotFoundComponent } from "./__root";

const ways = [
  {
    title: "Donate",
    body: "Give towards talent development, equipment or outreach, or where support is needed most.",
    href: "/support/donate",
    cta: "Make a donation",
  },
  {
    title: "Pledge equipment",
    body: "Offer golf equipment or training materials. The academy confirms what it can receive before anything is shipped.",
    href: "/support/equipment",
    cta: "See what is needed",
  },
  {
    title: "Sponsor or partner",
    body: "Work with the academy on events, programs or corporate training.",
    href: "/support/sponsor",
    cta: "Start a conversation",
  },
] as const;

const purposeNotes = {
  "talent-development": "Supports the training and development of young golfers.",
  equipment: "Helps young golfers get the clubs and training materials they need.",
  outreach: "Supports school and community golf outreach.",
  "where-needed": "Goes to the academy's greatest needs.",
} satisfies Record<(typeof donationPurposes)[number], string>;

function SupportPage() {
  return (
    <>
      <PageHeader
        title="Support the academy"
        lead="Help young golfers train, play and grow. You can give financially, offer equipment or partner with the academy."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Support" }]}
      />

      <Section>
        <Container>
          <ul className="grid gap-6 md:grid-cols-3">
            {ways.map((way) => (
              <li
                key={way.href}
                className="border-line hover:border-fairway relative flex flex-col gap-3 rounded-md border bg-white p-6 transition-colors"
              >
                <h2 className="text-2xl">{way.title}</h2>
                <p className="text-slate">{way.body}</p>
                <Link
                  href={way.href}
                  className="text-canopy mt-2 inline-flex items-center gap-2 font-medium after:absolute after:inset-0"
                >
                  {way.cta}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section tone="sand">
        <Container className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <SectionHeading
            title="Where donations can go"
            description="When you donate you choose a purpose, so your gift goes where you want it to."
          />
          <dl className="divide-line border-line divide-y border-y">
            {donationPurposes.map((purpose) => (
              <div key={purpose} className="grid gap-1 py-4 sm:grid-cols-[12rem_1fr]">
                <dt className="font-display text-fairway text-lg font-semibold">
                  {purposeLabels[purpose]}
                </dt>
                <dd className="text-slate">{purposeNotes[purpose]}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </Section>

      <Section tone="dark" space="compact">
        <Container className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <SectionHeading
            onDark
            title="Questions about supporting the academy?"
            description="Get in touch and the academy will help."
          />
          <Button asChild size="lg">
            <Link href="/contact">Contact the academy</Link>
          </Button>
        </Container>
      </Section>
    </>
  );
}

export const Route = createFileRoute("/support/")({
  errorComponent: ErrorComponent,
  notFoundComponent: NotFoundComponent,
  head: () =>
    pageHead({
      title: "Support the academy",
      description:
        "Support Mwenge Golf Academy by donating, pledging golf equipment, or partnering with the academy to help young golfers in Uganda.",
      path: "/support",
    }),
  component: SupportPage,
});
