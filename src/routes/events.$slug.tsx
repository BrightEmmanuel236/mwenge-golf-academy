import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import Link from "@/components/app-link";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Section } from "@/components/layout/section";
import { SmartImage } from "@/components/media/smart-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { eventQuery } from "@/lib/content/queries";
import { formatEventWhen } from "@/lib/format";
import { pageHead } from "@/lib/seo";
import { ErrorComponent, NotFoundComponent } from "./__root";

const typeLabel = {
  tournament: "Tournament",
  outreach: "Outreach",
  clinic: "Clinic",
  fundraiser: "Fundraiser",
} as const;

function EventPage() {
  const { slug } = Route.useParams();
  const {
    data: { event },
  } = useSuspenseQuery(eventQuery(slug));
  const details = [
    { label: "When", value: formatEventWhen(event.startsAt, event.endsAt) },
    { label: "Where", value: event.venue },
    { label: "Type", value: typeLabel[event.type] },
  ];
  return (
    <>
      <PageHeader
        title={event.title}
        lead={event.summary}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Events", href: "/events" },
          { label: event.title },
        ]}
      />
      <Section space="compact" className="md:py-20">
        <Container className="flex flex-col gap-12">
          <SmartImage
            role="banner"
            priority
            src={event.image.src}
            source={event.image.source}
            alt={event.image.alt}
            focal={event.image.focal}
            className="rounded-md"
          />
          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
            <div className="flex flex-col gap-4">
              <Badge className="self-start">{typeLabel[event.type]}</Badge>
              <p className="measure text-slate text-lg">{event.summary}</p>
            </div>
            <div className="flex flex-col gap-6">
              <dl className="divide-line border-line divide-y border-y">
                {details.map((row) => (
                  <div key={row.label} className="grid gap-1 py-3 sm:grid-cols-[6rem_1fr]">
                    <dt className="text-slate">{row.label}</dt>
                    <dd className="font-medium">{row.value}</dd>
                  </div>
                ))}
              </dl>
              <div>
                <Button asChild>
                  <Link href="/contact">Enquire about this event</Link>
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}

export const Route = createFileRoute("/events/$slug")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(eventQuery(params.slug)),
  errorComponent: ErrorComponent,
  notFoundComponent: NotFoundComponent,
  head: ({ loaderData }) =>
    loaderData
      ? pageHead({
          title: loaderData.event.title,
          description: loaderData.event.summary,
          path: `/events/${loaderData.event.slug}`,
        })
      : { meta: [{ title: "Event not found" }] },
  component: EventPage,
});
