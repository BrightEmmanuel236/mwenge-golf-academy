import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import Link from "@/components/app-link";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/layout/section-heading";
import { ContentPending } from "@/components/site/content-pending";
import { StatStrip } from "@/components/site/stat-strip";
import { TalentCard } from "@/components/site/talent-card";
import { Button } from "@/components/ui/button";
import { impactQuery } from "@/lib/content/queries";
import { pageHead } from "@/lib/seo";
import { ErrorComponent, NotFoundComponent } from "./__root";

function ImpactPage() {
  const {
    data: { figures, talents },
  } = useSuspenseQuery(impactQuery);
  return (
    <>
      <PageHeader
        title="Talent and impact"
        lead="The young golfers the academy is developing, and the difference its work makes in schools and communities."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Impact" }]}
      />

      <StatStrip figures={figures} />

      <Section>
        <Container className="flex flex-col gap-10">
          <SectionHeading
            title="Outreach and results"
            description="Verified figures and stories from the academy's work will appear here."
          />
          {figures.length === 0 ? (
            <ContentPending what="Verified impact figures, with the date they apply to, and outreach stories with photographs taken with consent." />
          ) : null}
        </Container>
      </Section>

      <Section tone="sand">
        <Container className="flex flex-col gap-10">
          <SectionHeading
            title="Young golfers"
            description="Profiles of young golfers appear here with the consent of their parents or guardians."
          />
          {talents.length > 0 ? (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {talents.map((talent) => (
                <li key={talent.slug}>
                  <TalentCard talent={talent} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="measure text-slate">
              There are no profiles to show yet. The academy publishes a young person&rsquo;s
              profile only when a parent or guardian has given written consent.
            </p>
          )}
        </Container>
      </Section>

      <Section tone="dark" space="compact">
        <Container className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <SectionHeading
            onDark
            title="Help develop young talent"
            description="Support the academy's talent development work."
          />
          <Button asChild size="lg">
            <Link href="/support/donate?purpose=talent-development">
              Support talent development
            </Link>
          </Button>
        </Container>
      </Section>
    </>
  );
}

export const Route = createFileRoute("/impact/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(impactQuery),
  errorComponent: ErrorComponent,
  notFoundComponent: NotFoundComponent,
  head: () =>
    pageHead({
      title: "Talent and impact",
      description:
        "See the young golfers Mwenge Golf Academy is developing and the impact of its outreach in schools and communities in Uganda.",
      path: "/impact",
    }),
  component: ImpactPage,
});
