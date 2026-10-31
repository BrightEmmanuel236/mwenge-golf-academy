import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import Link from "@/components/app-link";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/layout/section-heading";
import { EventCard } from "@/components/site/event-card";
import { Button } from "@/components/ui/button";
import { eventsQuery } from "@/lib/content/queries";
import { pageHead } from "@/lib/seo";
import { ErrorComponent, NotFoundComponent } from "./__root";

function EventsPage() {
  const {
    data: { upcoming, past },
  } = useSuspenseQuery(eventsQuery);
  return (
    <>
      <PageHeader
        title="Events and outreach"
        lead="Tournaments, clinics and outreach days at the academy and in schools and communities."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Events" }]}
      />

      <Section>
        <Container className="flex flex-col gap-10">
          <SectionHeading title="Upcoming" />
          {upcoming.length > 0 ? (
            <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((event) => (
                <li key={event.slug}>
                  <EventCard event={event} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="measure text-slate">
              There are no upcoming events listed at the moment. Check back soon, or get in touch to
              hear about events first.
            </p>
          )}
        </Container>
      </Section>

      {past.length > 0 ? (
        <Section tone="sand">
          <Container className="flex flex-col gap-10">
            <SectionHeading title="Past events" />
            <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {past.map((event) => (
                <li key={event.slug}>
                  <EventCard event={event} />
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}

      <Section tone="dark" space="compact">
        <Container className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <SectionHeading
            onDark
            title="Bring golf to your school or community"
            description="Ask the academy about outreach."
          />
          <Button asChild size="lg">
            <Link href="/contact">Contact the academy</Link>
          </Button>
        </Container>
      </Section>
    </>
  );
}

export const Route = createFileRoute("/events/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(eventsQuery),
  errorComponent: ErrorComponent,
  notFoundComponent: NotFoundComponent,
  head: () =>
    pageHead({
      title: "Events and outreach",
      description:
        "Upcoming and past tournaments, clinics and school and community outreach events from Mwenge Golf Academy.",
      path: "/events",
    }),
  component: EventsPage,
});
