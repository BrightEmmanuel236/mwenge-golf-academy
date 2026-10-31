import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import Link from "@/components/app-link";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Section } from "@/components/layout/section";
import { SmartImage } from "@/components/media/smart-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { newsQuery } from "@/lib/content/queries";
import { formatDate } from "@/lib/format";
import { pageHead } from "@/lib/seo";
import { ErrorComponent, NotFoundComponent } from "./__root";

function NewsArticlePage() {
  const { slug } = Route.useParams();
  const {
    data: { post },
  } = useSuspenseQuery(newsQuery(slug));
  const paragraphs = post.body && post.body.length > 0 ? post.body : [post.excerpt];
  return (
    <>
      <PageHeader
        title={post.title}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "News", href: "/news" },
          { label: post.title },
        ]}
      >
        <div className="text-ivory/85 flex items-center gap-3 text-sm">
          <Badge variant="dark">{post.category}</Badge>
          <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
        </div>
      </PageHeader>
      <Section space="compact" className="md:py-20">
        <Container width="narrow" className="flex flex-col gap-8">
          <SmartImage
            role="banner"
            priority
            src={post.image.src}
            source={post.image.source}
            alt={post.image.alt}
            focal={post.image.focal}
            className="rounded-md"
          />
          <div className="flex flex-col gap-5">
            {paragraphs.map((paragraph) => (
              <p key={paragraph} className="text-lg text-slate">
                {paragraph}
              </p>
            ))}
          </div>
          <div>
            <Button asChild variant="secondary">
              <Link href="/news">All news</Link>
            </Button>
          </div>
        </Container>
      </Section>
    </>
  );
}

export const Route = createFileRoute("/news/$slug")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(newsQuery(params.slug)),
  errorComponent: ErrorComponent,
  notFoundComponent: NotFoundComponent,
  head: ({ loaderData }) =>
    loaderData
      ? pageHead({
          title: loaderData.post.title,
          description: loaderData.post.excerpt,
          path: `/news/${loaderData.post.slug}`,
        })
      : { meta: [{ title: "Article not found" }] },
  component: NewsArticlePage,
});
