import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ErrorComponent, NotFoundComponent } from "./__root";
import { programsQuery } from "@/lib/content/queries";
import { pageHead } from "@/lib/seo";
import Link from "@/components/app-link";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/layout/section-heading";
import { ProgramList } from "@/components/site/program-list";
import { Button } from "@/components/ui/button";

function ProgramsPage() {
  const { data: programs } = useSuspenseQuery(programsQuery);
  const { audience } = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <>
      <PageHeader
        title="Programs and training"
        lead="Golf training for juniors, adults and corporate clients. Choose a program and send an enquiry."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Programs" }]}
      />
      <Section space="compact" className="md:py-20">
        <Container>
          <ProgramList programs={programs} filter={audience} onFilterChange={(value) => { void navigate({ search: { audience: value } }); }} />
        </Container>
      </Section>
      <Section tone="sand" space="compact">
        <Container className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <SectionHeading
            title="Not sure which program suits you?"
            description="Tell the academy about your goals and experience and they will help you choose."
          />
          <Button asChild size="lg">
            <Link href="/contact">Contact the academy</Link>
          </Button>
        </Container>
      </Section>
    </>
  );
}

export const Route = createFileRoute("/programs/")({
  validateSearch: (search: Record<string, unknown>): { audience: "all" | "junior" | "adult" | "corporate" } => ({
    audience: search["audience"] === "junior" || search["audience"] === "adult" || search["audience"] === "corporate" ? search["audience"] : "all",
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(programsQuery),
  errorComponent: ErrorComponent,
  notFoundComponent: NotFoundComponent,
  head: () =>
    pageHead({
      title: "Programs and training",
      description:
        "Golf programs for juniors, adults and corporate clients at Mwenge Golf Academy. Browse programs and send an enquiry.",
      path: "/programs",
    }),
  component: ProgramsPage,
});
