import { createFileRoute } from "@tanstack/react-router";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/layout/section-heading";
import { SponsorForm } from "@/components/site/sponsor-form";
import { Steps } from "@/components/site/steps";
import { pageHead } from "@/lib/seo";
import { ErrorComponent, NotFoundComponent } from "./__root";

const opportunities = [
  { title: "Event sponsorship", body: "Back tournaments, clinics and outreach days." },
  { title: "Program sponsorship", body: "Support the academy's training programs." },
  { title: "Equipment partnership", body: "Provide golf equipment and training materials." },
  {
    title: "Corporate training",
    body: "Work with the academy on coaching and golf experiences for your team.",
  },
] as const;

const steps = [
  {
    title: "Send an enquiry",
    body: "Tell the academy about your organization and how you would like to help.",
  },
  {
    title: "The academy follows up",
    body: "Someone from the academy contacts you to talk it through.",
  },
  {
    title: "Agree how to work together",
    body: "You and the academy decide what the partnership looks like.",
  },
  {
    title: "Be recognised, with your permission",
    body: "Partners are listed on the website only with written permission.",
  },
] as const;

function SponsorPage() {
  return (
    <>
      <PageHeader
        title="Sponsor or partner"
        lead="Organizations, clubs and companies can work with the academy to help young golfers and grow the game in Uganda."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Support", href: "/support" },
          { label: "Sponsor or partner" },
        ]}
      />

      <Section>
        <Container className="flex flex-col gap-12">
          <SectionHeading title="Ways to work together" />
          <ul className="grid gap-6 md:grid-cols-2">
            {opportunities.map((item) => (
              <li key={item.title} className="border-gold flex flex-col gap-2 border-t-2 pt-5">
                <h3 className="text-2xl">{item.title}</h3>
                <p className="text-slate">{item.body}</p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section tone="sand">
        <Container className="flex flex-col gap-10">
          <SectionHeading title="How it works" />
          <Steps items={[...steps]} />
        </Container>
      </Section>

      <Section id="enquire" className="scroll-mt-24" space="compact">
        <Container width="narrow" className="flex flex-col gap-8 md:py-8">
          <SectionHeading title="Start a conversation" />
          <SponsorForm />
        </Container>
      </Section>
    </>
  );
}

export const Route = createFileRoute("/support/sponsor")({
  errorComponent: ErrorComponent,
  notFoundComponent: NotFoundComponent,
  head: () =>
    pageHead({
      title: "Sponsor or partner",
      description:
        "Sponsor or partner with Mwenge Golf Academy on events, programs, equipment or corporate training.",
      path: "/support/sponsor",
    }),
  component: SponsorPage,
});
