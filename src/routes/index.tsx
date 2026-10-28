import { createFileRoute } from "@tanstack/react-router";
import type * as React from "react";
import Link from "@/components/app-link";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/layout/section-heading";
import { Button } from "@/components/ui/button";

// F0 holding page: the real Home page is built in F1. Not indexed.

function HomePage() {
  return (
    <Section>
      <Container>
        <SectionHeading
          as="h1"
          title="Front end foundation is in place"
          description="This is a temporary page. The Home page is built in phase F1. Review the design system and shared components on the style guide."
        />
        <div className="mt-10">
          <Button asChild variant="dark">
            <Link href="/style-guide">Open the style guide</Link>
          </Button>
        </div>
      </Container>
    </Section>
  );
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mwenge Golf Academy" },
      { name: "description", content: "A grassroots golf and youth-development initiative in Uganda." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Mwenge Golf Academy" },
      { property: "og:description", content: "A grassroots golf and youth-development initiative in Uganda." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});
