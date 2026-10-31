import { createFileRoute } from "@tanstack/react-router";
import Link from "@/components/app-link";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Section } from "@/components/layout/section";
import { ContactForm } from "@/components/site/contact-form";
import { ContentPending } from "@/components/site/content-pending";
import { pageHead } from "@/lib/seo";
import { site } from "@/lib/site";
import { ErrorComponent, NotFoundComponent } from "./__root";

function ContactPage() {
  const { contact } = site;
  const hasDetails = Boolean(contact.email || contact.phone || contact.whatsapp || contact.address);
  return (
    <>
      <PageHeader
        title="Contact the academy"
        lead="Send a message and the academy will reply. For training, programs, donations, equipment or partnerships, choose the topic that fits best."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Contact" }]}
      />
      <Section space="compact" className="md:py-20">
        <Container className="grid gap-12 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
          <div>
            <h2 className="mb-6 text-2xl">Send a message</h2>
            <ContactForm />
          </div>

          <aside className="flex flex-col gap-8" aria-label="Other ways to reach the academy">
            <div>
              <h2 className="text-2xl">Contact details</h2>
              {hasDetails ? (
                <ul className="mt-4 flex flex-col gap-2">
                  {contact.email ? (
                    <li>
                      <a
                        className="text-canopy underline underline-offset-4"
                        href={`mailto:${contact.email}`}
                      >
                        {contact.email}
                      </a>
                    </li>
                  ) : null}
                  {contact.phone ? (
                    <li>
                      <a
                        className="text-canopy underline underline-offset-4"
                        href={`tel:${contact.phone.replace(/\s/g, "")}`}
                      >
                        {contact.phone}
                      </a>
                    </li>
                  ) : null}
                  {contact.address ? <li>{contact.address}</li> : null}
                </ul>
              ) : (
                <div className="mt-4">
                  <ContentPending what="Email, phone, WhatsApp and address, plus a map and opening hours." />
                </div>
              )}
            </div>

            <div className="bg-sand rounded-md p-6">
              <h2 className="text-2xl">Safeguarding concerns</h2>
              <p className="text-slate mt-2">
                If you are worried about the safety of a young person, tell the academy straight
                away.
              </p>
              {contact.safeguardingEmail ? (
                <p className="mt-3">
                  <a
                    className="text-canopy underline underline-offset-4"
                    href={`mailto:${contact.safeguardingEmail}`}
                  >
                    {contact.safeguardingEmail}
                  </a>
                </p>
              ) : (
                <div className="mt-3">
                  <ContentPending what="A dedicated safeguarding contact, which goes directly to the Safeguarding Lead." />
                </div>
              )}
              <p className="mt-3 text-sm">
                <Link
                  href="/legal/safeguarding"
                  className="text-canopy underline underline-offset-4"
                >
                  Read the safeguarding page
                </Link>
              </p>
            </div>
          </aside>
        </Container>
      </Section>
    </>
  );
}

export const Route = createFileRoute("/contact")({
  errorComponent: ErrorComponent,
  notFoundComponent: NotFoundComponent,
  head: () =>
    pageHead({
      title: "Contact",
      description:
        "Contact Mwenge Golf Academy about training, junior programs, donations, equipment donations or partnerships.",
      path: "/contact",
    }),
  component: ContactPage,
});
