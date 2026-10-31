import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/layout/section-heading";
import { PledgeForm } from "@/components/site/pledge-form";
import { Steps } from "@/components/site/steps";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { equipmentNeedsQuery } from "@/lib/content/queries";
import { pageHead } from "@/lib/seo";
import { ErrorComponent, NotFoundComponent } from "./__root";

const priorityLabel = {
  high: "High priority",
  medium: "Medium priority",
  low: "Low priority",
} as const;

const steps = [
  {
    title: "Tell us what you would like to give",
    body: "Use the form below to describe the items, their condition and where they would ship from.",
  },
  {
    title: "The academy reviews your pledge",
    body: "It checks your pledge against what the academy needs and can receive.",
  },
  {
    title: "You receive a reply",
    body: "If the pledge is accepted, the academy sends receiving instructions.",
  },
  {
    title: "You hear when items arrive",
    body: "The academy lets you know when your items have been received.",
  },
] as const;

function EquipmentPage() {
  const { data: needs } = useSuspenseQuery(equipmentNeedsQuery);
  return (
    <>
      <PageHeader
        title="Equipment donations"
        lead="Golf equipment and training materials, from Uganda and abroad, help young golfers get started and keep playing."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Support", href: "/support" },
          { label: "Equipment" },
        ]}
      />

      <Section space="compact">
        <Container>
          <Alert tone="info" title="Please pledge before shipping">
            The academy confirms what it can receive before anything is sent.
          </Alert>
        </Container>
      </Section>

      <Section space="compact" className="md:py-16">
        <Container className="flex flex-col gap-10">
          <SectionHeading title="What the academy needs" />
          {needs.length > 0 ? (
            <ul className="grid gap-4 md:grid-cols-2">
              {needs.map((need) => (
                <li
                  key={need.item}
                  className="border-line flex flex-col gap-2 rounded-md border bg-white p-5"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl">{need.item}</h3>
                    <Badge variant={need.priority === "high" ? "earth" : "neutral"}>
                      {priorityLabel[need.priority]}
                    </Badge>
                  </div>
                  {need.description ? <p className="text-slate">{need.description}</p> : null}
                  <p className="text-sm">
                    <span className="text-slate">Quantity needed:</span> {need.quantityNeeded}
                  </p>
                  <p className="text-sm">
                    <span className="text-slate">Accepted condition:</span> {need.acceptedCondition}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate">
              The academy will publish its current equipment needs here. You are welcome to pledge
              anyway and the academy will tell you what it can use.
            </p>
          )}
        </Container>
      </Section>

      <Section tone="sand">
        <Container className="flex flex-col gap-10">
          <SectionHeading title="How a pledge works" />
          <Steps items={[...steps]} />
        </Container>
      </Section>

      <Section id="pledge" className="scroll-mt-24" space="compact">
        <Container className="flex flex-col gap-8 md:py-8">
          <SectionHeading title="Make a pledge" />
          <PledgeForm />
        </Container>
      </Section>
    </>
  );
}

export const Route = createFileRoute("/support/equipment")({
  loader: ({ context }) => context.queryClient.ensureQueryData(equipmentNeedsQuery),
  errorComponent: ErrorComponent,
  notFoundComponent: NotFoundComponent,
  head: () =>
    pageHead({
      title: "Equipment donations",
      description:
        "Pledge golf equipment and training materials to Mwenge Golf Academy. See what the academy needs and how pledges work.",
      path: "/support/equipment",
    }),
  component: EquipmentPage,
});
