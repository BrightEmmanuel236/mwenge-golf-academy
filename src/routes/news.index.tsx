import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Section } from "@/components/layout/section";
import { NewsCard } from "@/components/site/news-card";
import { newsListQuery } from "@/lib/content/queries";
import { pageHead } from "@/lib/seo";
import { ErrorComponent, NotFoundComponent } from "./__root";

function NewsPage() {
  const { data: posts } = useSuspenseQuery(newsListQuery);
  return (
    <>
      <PageHeader
        title="News and updates"
        lead="Announcements and stories from Mwenge Golf Academy."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "News" }]}
      />
      <Section space="compact" className="md:py-20">
        <Container>
          <h2 className="sr-only">All news</h2>
          {posts.length > 0 ? (
            <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <li key={post.slug}>
                  <NewsCard post={post} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="measure text-slate">There are no news posts yet. Check back soon.</p>
          )}
        </Container>
      </Section>
    </>
  );
}

export const Route = createFileRoute("/news/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(newsListQuery),
  errorComponent: ErrorComponent,
  notFoundComponent: NotFoundComponent,
  head: () =>
    pageHead({
      title: "News and updates",
      description: "News, announcements and stories from Mwenge Golf Academy in Uganda.",
      path: "/news",
    }),
  component: NewsPage,
});
