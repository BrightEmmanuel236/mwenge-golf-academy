import { createFileRoute, notFound } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Section } from "@/components/layout/section";
import { SmartImage } from "@/components/media/smart-image";
import { EnquiryForm } from "@/components/site/enquiry-form";
import { StickyBookBar } from "@/components/site/sticky-book-bar";
import { Badge } from "@/components/ui/badge";
import { getProgramBySlug } from "@/lib/content";
import { audienceLabel, programPrice } from "@/lib/format";

function ProgramPage() {
  const { program } = Route.useLoaderData();

  const details = [
    { label: "Audience", value: audienceLabel[program.audience] },
    { label: "Level", value: program.level },
    { label: "Duration", value: program.duration },
    { label: "Schedule", value: program.schedulePattern },
    { label: "Venue", value: program.venue },
    { label: "Price", value: programPrice(program) },
  ].filter((row): row is { label: string; value: string } => Boolean(row.value));

  return (
    <div className="pb-24 md:pb-0">
      <PageHeader
        title={program.title}
        lead={program.summary}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Programs", href: "/programs" },
          { label: program.title },
        ]}
      />

      <Section space="compact" className="md:py-20">
        <Container className="flex flex-col gap-12">
          <SmartImage
            role="banner"
            priority
            src={program.image.src}
            source={program.image.source}
            alt={program.image.alt}
            focal={program.image.focal}
            className="rounded-md"
          />

          <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
            <div className="flex flex-col gap-10">
              <div className="flex flex-col gap-4">
                <Badge
                  variant={program.audience === "junior" ? "earth" : "neutral"}
                  className="self-start"
                >
                  {audienceLabel[program.audience]}
                </Badge>
                {program.description?.map((paragraph) => (
                  <p key={paragraph} className="measure text-slate text-lg">
                    {paragraph}
                  </p>
                ))}
                {program.whoFor ? (
                  <div className="mt-2">
                    <h2 className="text-2xl">Who it is for</h2>
                    <p className="measure text-slate mt-2">{program.whoFor}</p>
                  </div>
                ) : null}
              </div>

              <div>
                <h2 className="text-2xl">Program details</h2>
                <dl className="divide-line border-line mt-4 divide-y border-y">
                  {details.map((row) => (
                    <div key={row.label} className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr]">
                      <dt className="text-slate">{row.label}</dt>
                      <dd className="text-ink font-medium">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            <div
              id="enquire"
              className="border-line scroll-mt-28 self-start rounded-md border bg-white p-6 md:p-8 lg:sticky lg:top-28"
            >
              <h2 className="text-2xl">Send an enquiry</h2>
              <p className="text-slate mt-2 mb-6">
                Tell the academy a little about you and what you are looking for.
              </p>
              <EnquiryForm
                audience={program.audience}
                programSlug={program.slug}
                programTitle={program.title}
              />
            </div>
          </div>
        </Container>
      </Section>
      <StickyBookBar href={`/programs/${program.slug}#enquire`} label="Send enquiry" />
    </div>
  );
}

export const Route = createFileRoute("/programs/$slug")({
  loader: async ({ params }) => {
    const program = await getProgramBySlug(params.slug);
    if (!program) throw notFound();
    return { program };
  },
  head: ({ loaderData }) =>
    loaderData
      ? pageHead({
          title: loaderData.program.title,
          description: loaderData.program.summary,
          path: `/programs/${loaderData.program.slug}`,
        })
      : {
          ...pageHead({
            title: "Program unavailable",
            description: "This Mwenge Golf Academy program is unavailable. Browse our junior, adult and corporate programs.",
            path: "/programs",
          }),
          meta: [
            ...pageHead({
              title: "Program unavailable",
              description: "This Mwenge Golf Academy program is unavailable. Browse our junior, adult and corporate programs.",
              path: "/programs",
            }).meta,
            { name: "robots", content: "noindex" },
          ],
        },
  component: ProgramPage,
});
