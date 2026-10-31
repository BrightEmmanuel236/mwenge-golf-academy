import { createFileRoute, notFound } from "@tanstack/react-router";
import Link from "@/components/app-link";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Section } from "@/components/layout/section";
import { ContentPending } from "@/components/site/content-pending";
import { Alert } from "@/components/ui/alert";
import { legalPages } from "@/lib/content/pages";
import { pageHead } from "@/lib/seo";
import { ErrorComponent, NotFoundComponent } from "./__root";

const findPage = (slug: string) => legalPages.find((page) => page.slug === slug);

function LegalPage() {
  const { slug } = Route.useParams();
  const page = findPage(slug);
  if (!page) return null;
  return (
    <>
      <PageHeader
        title={page.title}
        lead={page.description}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: page.title }]}
      />
      <Section space="compact" className="md:py-20">
        <Container width="narrow" className="flex flex-col gap-8">
          <Alert tone="warning" title="Final text to be supplied">
            This page is waiting for wording approved by the academy and its legal adviser. The
            sections below show what it will cover.
          </Alert>
          <ol className="flex flex-col gap-6">
            {page.outline.map((heading) => (
              <li key={heading} className="flex flex-col gap-2">
                <h2 className="text-2xl">{heading}</h2>
                <ContentPending what="Approved wording for this section." />
              </li>
            ))}
          </ol>
          <p className="text-slate text-sm">
            Questions in the meantime?{" "}
            <Link href="/contact" className="text-canopy underline underline-offset-4">
              Contact the academy
            </Link>
            .
          </p>
        </Container>
      </Section>
    </>
  );
}

export const Route = createFileRoute("/legal/$slug")({
  loader: ({ params }) => {
    const page = findPage(params.slug);
    if (!page) throw notFound();
    return { slug: page.slug };
  },
  errorComponent: ErrorComponent,
  notFoundComponent: NotFoundComponent,
  head: ({ params }) => {
    const page = findPage(params.slug);
    return page
      ? pageHead({
          title: page.title,
          description: page.description,
          path: `/legal/${page.slug}`,
          // Not indexed until the approved text replaces this outline.
          noindex: true,
        })
      : { meta: [{ title: "Page not found" }] };
  },
  component: LegalPage,
});
