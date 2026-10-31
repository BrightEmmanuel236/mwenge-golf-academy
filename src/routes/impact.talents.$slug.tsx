import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import Link from "@/components/app-link";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Section } from "@/components/layout/section";
import { SmartImage } from "@/components/media/smart-image";
import { Button } from "@/components/ui/button";
import { talentQuery } from "@/lib/content/queries";
import { pageHead } from "@/lib/seo";
import { ErrorComponent, NotFoundComponent } from "./__root";

function TalentPage() {
  const { slug } = Route.useParams();
  const {
    data: { talent },
  } = useSuspenseQuery(talentQuery(slug));
  return (
    <>
      <PageHeader
        title={talent.displayName}
        lead={`Age ${talent.ageBand}`}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Impact", href: "/impact" },
          { label: talent.displayName },
        ]}
      />
      <Section space="compact" className="md:py-20">
        <Container className="grid gap-12 md:grid-cols-[1fr_1.4fr] md:gap-16">
          {talent.photo?.src ? (
            <SmartImage
              role="portrait"
              src={talent.photo.src}
              source={talent.photo.source}
              alt={talent.photo.alt}
              focal={talent.photo.focal}
              className="rounded-md"
            />
          ) : null}
          <div className="flex flex-col gap-8">
            {talent.story ? <p className="measure text-lg text-slate">{talent.story}</p> : null}
            {talent.achievements.length > 0 ? (
              <div>
                <h2 className="text-2xl">Achievements</h2>
                <ul className="divide-line border-line mt-4 divide-y border-y">
                  {talent.achievements.map((achievement) => (
                    <li key={achievement} className="py-3">
                      {achievement}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div>
              <Button asChild variant="secondary">
                <Link href="/impact">All young golfers</Link>
              </Button>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}

export const Route = createFileRoute("/impact/talents/$slug")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(talentQuery(params.slug)),
  errorComponent: ErrorComponent,
  notFoundComponent: NotFoundComponent,
  head: ({ loaderData }) =>
    loaderData
      ? pageHead({
          title: loaderData.talent.displayName,
          description: `Profile of ${loaderData.talent.displayName}, a young golfer at Mwenge Golf Academy.`,
          path: `/impact/talents/${loaderData.talent.slug}`,
          // Individual pages of young people are indexed only when the guardian explicitly agreed.
          noindex: !loaderData.talent.indexable,
        })
      : { meta: [{ title: "Profile not found" }] },
  component: TalentPage,
});
