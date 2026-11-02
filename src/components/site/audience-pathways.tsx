import Link from "@/components/app-link";

const pathways = [
  { title: "Juniors", body: "Young golfers learning the game and developing their talent." },
  { title: "Adults", body: "Professional golf training for adults at any stage." },
  {
    title: "Corporate clients",
    body: "Coaching and golf experiences for teams and organizations.",
  },
] as const;

/**
 * Shown in place of the program list until the academy has published programs. It keeps the page
 * useful (who the academy trains, and how to enquire) instead of leaving an empty heading.
 */
export function AudiencePathways({
  intro,
  headingLevel: Heading = "h3",
}: {
  intro?: string;
  /** Use "h2" when the list follows the page title directly, "h3" under a section heading. */
  headingLevel?: "h2" | "h3";
}) {
  return (
    <div className="flex flex-col gap-8">
      {intro ? <p className="measure text-slate text-lg">{intro}</p> : null}
      <ul className="grid gap-6 md:grid-cols-3">
        {pathways.map((pathway) => (
          <li key={pathway.title} className="border-gold flex flex-col gap-3 border-t-2 pt-5">
            <Heading className="text-2xl">{pathway.title}</Heading>
            <p className="text-slate">{pathway.body}</p>
            <Link
              href="/contact"
              className="text-canopy hover:text-fairway font-medium underline underline-offset-4"
            >
              Ask about {pathway.title.toLowerCase()} training
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
