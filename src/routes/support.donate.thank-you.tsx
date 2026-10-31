import { createFileRoute } from "@tanstack/react-router";
import Link from "@/components/app-link";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Section } from "@/components/layout/section";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { paymentsConnected } from "@/lib/forms";
import { pageHead } from "@/lib/seo";
import { ErrorComponent, NotFoundComponent } from "./__root";

function ThankYouPage() {
  return (
    <>
      <PageHeader
        title={paymentsConnected ? "Thank you" : "Thank you for your interest"}
        lead="Support from people like you helps the academy reach more young golfers."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Support", href: "/support" },
          { label: "Donate", href: "/support/donate" },
          { label: "Thank you" },
        ]}
      />
      <Section space="compact" className="md:py-20">
        <Container width="narrow" className="flex flex-col gap-8">
          {!paymentsConnected ? (
            <Alert tone="warning" title="Online giving is not switched on yet">
              This page will confirm gifts once online giving opens. No payment has been taken.
            </Alert>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/">Back to the home page</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/support">Other ways to help</Link>
            </Button>
          </div>
        </Container>
      </Section>
    </>
  );
}

export const Route = createFileRoute("/support/donate/thank-you")({
  errorComponent: ErrorComponent,
  notFoundComponent: NotFoundComponent,
  head: () =>
    pageHead({
      title: "Thank you",
      description: "Thank you for supporting Mwenge Golf Academy.",
      path: "/support/donate/thank-you",
      noindex: true,
    }),
  component: ThankYouPage,
});
