import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";
import Link from "@/components/app-link";
import { Container } from "@/components/layout/container";
import { FeatureSplit } from "@/components/layout/feature-split";
import { PageHeader } from "@/components/layout/page-header";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/layout/section-heading";
import { SmartImage } from "@/components/media/smart-image";
import { FaqList } from "@/components/site/faq-list";
import { StickyBookBar } from "@/components/site/sticky-book-bar";
import { Button } from "@/components/ui/button";
import { pillars, youthFaq } from "@/lib/content/pages";

const forParents = [
  {
    title: "A parent or guardian makes the enquiry",
    body: "Junior enquiries are submitted by a parent or guardian, and we only ask for a child’s first name and age.",
  },
  {
    title: "The academy talks it through with you",
    body: "After you enquire, the academy contacts you to discuss the program and next steps.",
  },
  {
    title: "Your consent comes first",
    body: "Photographs and stories of young people are published only with a parent or guardian’s written consent.",
  },
] as const;

function YouthDevelopmentPage() {
  return (
    <div className="pb-24 md:pb-0">
      <PageHeader
        title="Junior and youth development"
        lead="Finding young talent and giving it the training, mentoring and equipment to grow."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Youth development" }]}
      />

      <FeatureSplit
        media={
          <SmartImage
            role="feature"
            src="/placeholders/practice-green.svg"
            source="placeholder"
            alt="Abstract illustration of a putting green with a flag"
          />
        }
      >
        <SectionHeading title="More than technique" />
        <p className="measure text-slate text-lg">
          Mwenge Golf Academy is a grassroots initiative. It looks for young golf talent in schools
          and communities, then trains, mentors and equips those young people so they can grow in
          the game.
        </p>
        <div>
          <Button asChild>
            <Link href="/programs">Explore programs</Link>
          </Button>
        </div>
      </FeatureSplit>

      <Section tone="sand">
        <Container className="flex flex-col gap-12">
          <SectionHeading title="How young golfers are developed" />
          <ol className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {pillars.map((pillar, index) => (
              <li key={pillar.title} className="border-gold flex flex-col gap-3 border-t-2 pt-5">
                <span className="font-display text-gold-ink text-sm font-semibold">
                  Step {index + 1}
                </span>
                <h3 className="text-2xl">{pillar.title}</h3>
                <p className="text-slate">{pillar.long}</p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section>
        <Container className="grid gap-10 md:grid-cols-[1fr_1.2fr] md:gap-16">
          <div className="flex flex-col gap-6">
            <SectionHeading
              title="School and community outreach"
              description="The academy takes golf into schools and communities so more young people can try the game."
            />
            <div>
              <Button asChild variant="secondary">
                <Link href="/events">Events and outreach</Link>
              </Button>
            </div>
          </div>
          <SmartImage
            role="card"
            src={null}
            source="academy"
            decorative
            emptyLabel="Outreach photography to be added"
            className="rounded-md"
          />
        </Container>
      </Section>

      <Section tone="sand">
        <Container className="flex flex-col gap-12">
          <SectionHeading
            title="For parents and guardians"
            description="What to expect when you enquire about a junior program."
          />
          <ol className="grid gap-8 md:grid-cols-3">
            {forParents.map((item, index) => (
              <li key={item.title} className="flex flex-col gap-3">
                <span
                  aria-hidden="true"
                  className="bg-fairway font-display text-ivory flex size-10 items-center justify-center rounded-full font-semibold"
                >
                  {index + 1}
                </span>
                <h3 className="text-xl">{item.title}</h3>
                <p className="text-slate">{item.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section>
        <Container className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <SectionHeading title="Questions from parents" />
          <FaqList items={youthFaq.map((q) => ({ question: q.question, answer: q.answer }))} />
        </Container>
      </Section>

      <Section tone="dark" space="compact">
        <Container className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <SectionHeading
            onDark
            title="Enquire about a junior program"
            description="A parent or guardian can send an enquiry in a few minutes."
          />
          <Button asChild size="lg">
            <Link href="/programs">Junior programs</Link>
          </Button>
        </Container>
      </Section>
      <StickyBookBar href="/programs" label="Explore junior programs" />
    </div>
  );
}

export const Route = createFileRoute("/youth-development")({
  head: () =>
    pageHead({
      title: "Junior and youth development",
      description:
        "How Mwenge Golf Academy finds, trains, mentors and equips young golfers in Uganda, and what parents and guardians can expect.",
      path: "/youth-development",
    }),
  component: YouthDevelopmentPage,
});
