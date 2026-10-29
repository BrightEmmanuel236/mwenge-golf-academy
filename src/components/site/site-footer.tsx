import Link from "@/components/app-link";
import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/layout/container";
import { footerNav, site } from "@/lib/site";

function FooterList({
  title,
  links,
}: {
  title: string;
  links: readonly { label: string; href: string }[];
}) {
  return (
    <div>
      <h2 className="text-gold font-sans text-sm font-semibold">{title}</h2>
      <ul className="mt-4 flex flex-col gap-1">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-ivory/85 hover:text-gold inline-block py-1.5 text-[0.9375rem] transition-colors"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  const { contact } = site;
  const hasContact = Boolean(contact.email || contact.phone || contact.whatsapp || contact.address);

  return (
    <footer data-surface="dark" className="bg-night text-ivory">
      <Container className="py-16 md:py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="flex max-w-sm flex-col gap-5">
            <Logo surface="dark" className="h-28 self-start" />
            <p className="text-ivory/85 text-[0.9375rem]">{site.tagline}</p>
          </div>
          <FooterList title="Explore" links={footerNav.explore} />
          <FooterList title="Support" links={footerNav.support} />
          <div>
            <h2 className="text-gold font-sans text-sm font-semibold">Get in touch</h2>
            <ul className="text-ivory/85 mt-4 flex flex-col gap-1 text-[0.9375rem]">
              {contact.email ? (
                <li>
                  <a
                    className="hover:text-gold inline-block py-1.5"
                    href={`mailto:${contact.email}`}
                  >
                    {contact.email}
                  </a>
                </li>
              ) : null}
              {contact.phone ? (
                <li>
                  <a
                    className="hover:text-gold inline-block py-1.5"
                    href={`tel:${contact.phone.replace(/\s/g, "")}`}
                  >
                    {contact.phone}
                  </a>
                </li>
              ) : null}
              {contact.address ? <li className="py-1.5">{contact.address}</li> : null}
              <li>
                <Link className="hover:text-gold inline-block py-1.5" href="/contact">
                  {hasContact ? "Contact page" : "Contact the academy"}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-ivory/15 text-ivory/75 mt-14 flex flex-col gap-4 border-t pt-8 text-sm md:flex-row md:items-center md:justify-between">
          <p>
            &copy; {new Date().getFullYear()} {site.name}. All rights reserved.
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-1">
            {footerNav.legal.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-gold inline-block py-1.5">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </footer>
  );
}
