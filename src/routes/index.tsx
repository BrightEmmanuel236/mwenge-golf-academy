import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";
import Link from "@/components/app-link";
import { Container } from "@/components/layout/container";
import { FeatureSplit } from "@/components/layout/feature-split";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/layout/section-heading";
import { SmartImage } from "@/components/media/smart-image";
import { EventCard } from "@/components/site/event-card";
import { Hero } from "@/components/site/hero";
import { NewsCard } from "@/components/site/news-card";
import { ProgramCard } from "@/components/site/program-card";
import { StatStrip } from "@/components/site/stat-strip";
import { SupportBand } from "@/components/site/support-band";
import { Button } from "@/components/ui/button";
import { getEvents, getLatestNews, getPrograms, getVerifiedImpactFigures } from "@/lib/content";
import type { MediaRef } from "@/lib/content/media";
import { site } from "@/lib/site";
import { pillars } from "@/lib/content/pages";

// Placeholder photography until the academy supplies images (see README, "Content gaps").
const heroImage: MediaRef = {
  src: "/placeholders/fairway-dawn.svg",
  alt: "Abstract illustration of a fairway at dawn",
  source: "placeholder",
  focal: { x: 50, y: 60 },
};
const youthImage: MediaRef = {
  src: "/placeholders/practice-green.svg",
  alt: "Abstract illustration of a putting green with a flag",
  source: "placeholder",
};

function HomePage() {
  const { programs, figures, nextEvent, news } = Route.useLoaderData();

  return (
    <>
      <Hero
        image={heroImage}
        title="Mwenge Golf Academy"
        lead="Mwenge Golf Academy identifies, trains and mentors young golfers, and offers professional coaching for juniors, adults and corporate teams."
        primary={{ label: "Book Training", href: "/programs" }}
        secondary={{ label: "Support the academy", href: "/support" }}
      />

      <StatStrip figures={figures} />

      <Section>
        <Container className="flex flex-col gap-12">
          <SectionHeading
            title="Training for every golfer"
            description="Choose a program for juniors, adults or your team, then send an enquiry and the academy will be in touch."
          />
          <ul className="grid gap-6 md:grid-cols-3">
            {programs.slice(0, 3).map((program) => (
              <li key={program.slug}>
                <ProgramCard program={program} />
              </li>
            ))}
          </ul>
          <div>
            <Button asChild variant="secondary">
              <Link href="/programs">View all programs</Link>
            </Button>
          </div>
        </Container>
      </Section>

      <FeatureSplit
        tone="sand"
        media={
          <SmartImage
            role="feature"
            src={youthImage.src}
            source={youthImage.source}
            alt={youthImage.alt}
          />
        }
      >
        <SectionHeading
          title="Developing young golfers"
          description="The academy’s youth work is about more than technique. It finds young talent, trains it, mentors it and equips it."
        />
        <ul className="flex flex-col gap-4">
          {pillars.map((pillar) => (
            <li key={pillar.title} className="border-gold flex flex-col border-l-2 pl-4">
              <span className="font-display text-fairway text-lg font-semibold">
                {pillar.title}
              </span>
              <span className="text-slate">{pillar.short}</span>
            </li>
          ))}
        </ul>
        <div>
          <Button asChild variant="dark">
            <Link href="/youth-development">Junior and youth development</Link>
          </Button>
        </div>
      </FeatureSplit>

      {nextEvent ? (
        <Section>
          <Container className="grid items-center gap-10 md:grid-cols-[1fr_1.2fr] md:gap-16">
            <div className="flex flex-col gap-6">
              <SectionHeading
                title="Coming up"
                description="Tournaments, clinics and outreach days at the academy."
              />
              <div>
                <Button asChild variant="secondary">
                  <Link href="/events">All events and outreach</Link>
                </Button>
              </div>
            </div>
            <EventCard event={nextEvent} />
          </Container>
        </Section>
      ) : null}

      <SupportBand />

      {news.length > 0 ? (
        <Section>
          <Container className="flex flex-col gap-12">
            <SectionHeading title="Latest from the academy" />
            <ul className="grid gap-6 md:grid-cols-3">
              {news.map((post) => (
                <li key={post.slug}>
                  <NewsCard post={post} />
                </li>
              ))}
            </ul>
            <div>
              <Button asChild variant="secondary">
                <Link href="/news">All news</Link>
              </Button>
            </div>
          </Container>
        </Section>
      ) : null}

      <Section tone="sand" space="compact">
        <Container className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <SectionHeading
            title="Ready to start?"
            description="Send an enquiry and the academy will help you choose the right program."
          />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/programs">Book Training</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/contact">Contact the academy</Link>
            </Button>
          </div>
        </Container>
      </Section>
    </>
  );
}

export const Route = createFileRoute("/")({
  loader: async () => {
    const [programs, figures, events, news] = await Promise.all([
      getPrograms(),
      getVerifiedImpactFigures(),
      getEvents(),
      getLatestNews(3),
    ]);
    return { programs, figures, nextEvent: events.upcoming[0] ?? null, news };
  },
  head: () =>
    pageHead({
      title: "Mwenge Golf Academy | Golf training and youth development in Uganda",
      description:
        "Mwenge Golf Academy identifies, trains and mentors young golfers in Uganda, and offers professional golf training for juniors, adults and corporate clients.",
      path: "/",
      absoluteTitle: true,
    }),
  component: HomePage,
});
