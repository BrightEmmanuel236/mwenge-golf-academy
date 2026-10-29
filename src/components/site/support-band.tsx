import Link from "@/components/app-link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/layout/section-heading";

const ways = [
  {
    title: "Donate",
    body: "Give towards talent development, equipment or outreach.",
    href: "/support/donate",
    cta: "Make a donation",
  },
  {
    title: "Pledge equipment",
    body: "Clubs, bags and training aids can make a real difference to a young golfer.",
    href: "/support/equipment",
    cta: "See what is needed",
  },
  {
    title: "Sponsor or partner",
    body: "Work with the academy on events, programs or corporate training.",
    href: "/support/sponsor",
    cta: "Start a conversation",
  },
] as const;

export function SupportBand() {
  return (
    <Section tone="dark">
      <Container className="flex flex-col gap-12">
        <SectionHeading
          onDark
          title="Help young golfers play"
          description="Support from individuals, clubs and organizations, in Uganda and abroad, helps the academy reach more young people."
        />
        <ul className="grid gap-6 md:grid-cols-3">
          {ways.map((way) => (
            <li
              key={way.href}
              className="border-ivory/20 hover:border-gold relative flex flex-col gap-3 rounded-md border p-6 transition-colors"
            >
              <h3 className="text-2xl">{way.title}</h3>
              <p className="text-ivory/85">{way.body}</p>
              <Link
                href={way.href}
                className="text-gold mt-2 inline-flex items-center gap-2 font-medium after:absolute after:inset-0"
              >
                {way.cta}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
