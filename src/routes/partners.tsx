import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import Link from "@/components/app-link";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/layout/section-heading";
import { PartnerGrid } from "@/components/site/partner-grid";
import { Button } from "@/components/ui/button";
import { partnersQuery } from "@/lib/content/queries";
import { pageHead } from "@/lib/seo";
import { ErrorComponent, NotFoundComponent } from "./__root";

function PartnersPage() {
  const { data: partners } = useSuspenseQuery(partnersQuery);
  return (
    <>
      <PageHeader
        title="Sponsors and partners"
        lead="The organizations and people who work with the academy to help young golfers."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Partners" }]}
      />
      <Section space="compact" className="md:py-20">
        <Container>
          {partners.length > 0 ? (
            <PartnerGrid partners={partners} />
          ) : (
            <p className="measure text-slate text-lg">
              Sponsors and partners will be listed here, with their written permission.
            </p>
          )}
        </Container>
      </Section>
      <Section tone="dark" space="compact">
        <Container className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <SectionHeading
            onDark
            title="Work with the academy"
            description="Sponsor an event or program, or partner on equipment and training."
          />
          <Button asChild size="lg">
            <Link href="/support/sponsor">Sponsor or partner</Link>
          </Button>
        </Container>
      </Section>
    </>
  );
}

export const Route = createFileRoute("/partners")({
  loader: ({ context }) => context.queryClient.ensureQueryData(partnersQuery),
  errorComponent: ErrorComponent,
  notFoundComponent: NotFoundComponent,
  head: () =>
    pageHead({
      title: "Sponsors and partners",
      description:
        "The sponsors and partners supporting Mwenge Golf Academy and its work with young golfers.",
      path: "/partners",
    }),
  component: PartnersPage,
});
