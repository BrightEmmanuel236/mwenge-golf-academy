import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Section } from "@/components/layout/section";
import { ContentPending } from "@/components/site/content-pending";
import { GalleryGrid } from "@/components/site/gallery-grid";
import { galleryQuery } from "@/lib/content/queries";
import { pageHead } from "@/lib/seo";
import { ErrorComponent, NotFoundComponent } from "./__root";

function GalleryPage() {
  const { data: items } = useSuspenseQuery(galleryQuery);
  return (
    <>
      <PageHeader
        title="Gallery"
        lead="Photographs from the academy's training, events and outreach."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Gallery" }]}
      />
      <Section space="compact" className="md:py-20">
        <Container>
          {items.length > 0 ? (
            <GalleryGrid items={items} />
          ) : (
            <ContentPending what="Authentic academy photographs, each with usage rights recorded and, where young people appear, a guardian's written consent." />
          )}
        </Container>
      </Section>
    </>
  );
}

export const Route = createFileRoute("/gallery")({
  loader: ({ context }) => context.queryClient.ensureQueryData(galleryQuery),
  errorComponent: ErrorComponent,
  notFoundComponent: NotFoundComponent,
  head: () =>
    pageHead({
      title: "Gallery",
      description:
        "Photographs from Mwenge Golf Academy's training, events and outreach in Uganda.",
      path: "/gallery",
    }),
  component: GalleryPage,
});
