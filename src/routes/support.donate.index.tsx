import { createFileRoute } from "@tanstack/react-router";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Section } from "@/components/layout/section";
import { DonationForm } from "@/components/site/donation-form";
import { Alert } from "@/components/ui/alert";
import { paymentsConnected } from "@/lib/forms";
import { donationPurposes, type DonationPurpose } from "@/lib/schemas";
import { pageHead } from "@/lib/seo";
import { ErrorComponent, NotFoundComponent } from "./__root";

const isPurpose = (value: unknown): value is DonationPurpose =>
  typeof value === "string" && (donationPurposes as readonly string[]).includes(value);

function DonatePage() {
  const { purpose } = Route.useSearch();
  return (
    <>
      <PageHeader
        title="Donate"
        lead="Your gift helps the academy train, mentor and equip young golfers."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Support", href: "/support" },
          { label: "Donate" },
        ]}
      />
      <Section space="compact" className="md:py-20">
        <Container width="narrow" className="flex flex-col gap-8">
          {!paymentsConnected ? (
            <Alert tone="warning" title="Online giving is not switched on yet">
              You can explore the donation form, but no payment will be taken and nothing will be
              saved. Payment options will be confirmed when giving opens.
            </Alert>
          ) : null}
          <DonationForm initialPurpose={purpose} />
        </Container>
      </Section>
    </>
  );
}

export const Route = createFileRoute("/support/donate/")({
  validateSearch: (search: Record<string, unknown>): { purpose?: DonationPurpose } =>
    isPurpose(search["purpose"]) ? { purpose: search["purpose"] } : {},
  errorComponent: ErrorComponent,
  notFoundComponent: NotFoundComponent,
  head: () =>
    pageHead({
      title: "Donate",
      description:
        "Donate to Mwenge Golf Academy to support talent development, equipment and outreach for young golfers in Uganda.",
      path: "/support/donate",
    }),
  component: DonatePage,
});
