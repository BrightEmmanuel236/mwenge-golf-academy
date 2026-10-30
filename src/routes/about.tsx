import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";
import Link from "@/components/app-link";
import { Container } from "@/components/layout/container";
import { FeatureSplit } from "@/components/layout/feature-split";
import { PageHeader } from "@/components/layout/page-header";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/layout/section-heading";
import { SmartImage } from "@/components/media/smart-image";
import { ContentPending } from "@/components/site/content-pending";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { pillars } from "@/lib/content/pages";

const audiences = [
  {
    title: "Juniors",
    body: "Young golfers learning the game and developing their talent.",
    href: "/programs",
  },
  {
    title: "Adults",
    body: "Professional golf training for adults at any stage.",
    href: "/programs",
  },
  {
    title: "Corporate clients",
    body: "Coaching and golf experiences for teams and organizations.",
    href: "/programs",
  },
] as const;

function AboutPage() {
  return (
    <>
      <PageHeader
        title="About the academy"
        lead="A grassroots golf and youth-development initiative in Uganda."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "About" }]}
      />

      <FeatureSplit
        media={
          <SmartImage
            role="feature"
            src="/placeholders/fairway-dawn.svg"
            source="placeholder"
            alt="Abstract illustration of a fairway at dawn"
          />
        }
      >
        <SectionHeading title="Our mission" />
        <p className="measure text-slate text-lg">
          Mwenge Golf Academy identifies, trains, mentors and equips young golf talent in Uganda,
          while also providing professional golf training for juniors, adults and corporate clients.
        </p>
        <p className="measure text-slate">
          The academy works with golfers, parents, schools and communities, and with sponsors,
          donors, golf organizations and partners in Uganda and around the world.
        </p>
      </FeatureSplit>

      <Section tone="sand">
        <Container className="flex flex-col gap-12">
          <SectionHeading title="What the academy does" />
          <ol className="grid gap-6 md:grid-cols-2">
            {pillars.map((pillar, index) => (
              <li key={pillar.title}>
                <Card className="h-full">
                  <CardBody>
                    <span className="font-display text-gold-ink text-sm font-semibold">
                      0{index + 1}
                    </span>
                    <h3 className="text-2xl">{pillar.title}</h3>
                    <p className="text-slate">{pillar.long}</p>
                  </CardBody>
                </Card>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section>
        <Container className="flex flex-col gap-12">
          <SectionHeading title="Who the academy serves" />
          <ul className="grid gap-6 md:grid-cols-3">
            {audiences.map((audience) => (
              <li key={audience.title} className="border-gold flex flex-col gap-3 border-t-2 pt-5">
                <h3 className="text-2xl">{audience.title}</h3>
                <p className="text-slate">{audience.body}</p>
                <Link
                  href={audience.href}
                  className="text-canopy hover:text-fairway font-medium underline underline-offset-4"
                >
                  View programs
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section tone="sand">
        <Container className="flex flex-col gap-12">
          <SectionHeading title="Leadership and coaches" />
          <div className="grid gap-6 md:grid-cols-2">
            <ContentPending what="Founder and leadership profiles: names, roles and portrait photographs." />
            <ContentPending what="Coach profiles: names, qualifications and portrait photographs." />
          </div>
        </Container>
      </Section>

      <Section>
        <Container className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <SectionHeading
            title="Safeguarding young people"
            description="Protecting the young people who train with the academy comes first. Read how the academy approaches safeguarding."
          />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="dark" size="lg">
              <Link href="/legal/safeguarding">Safeguarding</Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/contact">Contact the academy</Link>
            </Button>
          </div>
        </Container>
      </Section>
    </>
  );
}

export const Route = createFileRoute("/about")({
  head: () =>
    pageHead({
      title: "About the academy",
      description:
        "Mwenge Golf Academy is a grassroots golf and youth-development initiative in Uganda that identifies, trains, mentors and equips young golf talent.",
      path: "/about",
    }),
  component: AboutPage,
});
