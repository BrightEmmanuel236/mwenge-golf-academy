import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import Link from "@/components/app-link";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/layout/section-heading";
import { SkipLink } from "@/components/layout/skip-link";
import { usePathname } from "@/hooks/use-pathname";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { Button } from "@/components/ui/button";
import { site } from "@/lib/site";
import appCss from "../styles.css?url";
import frauncesLatin from "@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2?url";
import interLatin from "@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

export function NotFoundComponent() {
  return (
    <Section>
      <Container>
        <SectionHeading
          as="h1"
          title="We can't find that page"
          description="The link may be out of date or the page may have moved. Try one of these instead."
        />
        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/">Go to the home page</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/programs">View programs</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/contact">Contact the academy</Link>
          </Button>
        </div>
      </Container>
    </Section>
  );
}

export function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <Section>
      <Container>
        <SectionHeading
          as="h1"
          title="Something went wrong on our side"
          description="Try again, or contact the academy if the problem continues."
        />
        <div className="mt-10 flex flex-wrap gap-3">
          <Button
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            Try again
          </Button>
          <Button asChild variant="secondary">
            <Link href="/contact">Contact the academy</Link>
          </Button>
        </div>
      </Container>
    </Section>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#0a3b23" },
      { title: site.name },
      { name: "description", content: site.tagline },
      { name: "application-name", content: site.name },
      { property: "og:site_name", content: site.name },
      { property: "og:locale", content: "en_UG" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      // Preload the two Latin font files every page needs so text paints in the final fonts sooner.
      {
        rel: "preload",
        as: "font",
        type: "font/woff2",
        href: interLatin,
        crossOrigin: "anonymous",
      },
      {
        rel: "preload",
        as: "font",
        type: "font/woff2",
        href: frauncesLatin,
        crossOrigin: "anonymous",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  // The staff area has its own frame: the public site's header and footer are not shown there.
  const inStaffArea = usePathname().startsWith("/admin");
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="flex min-h-dvh flex-col">
        <SkipLink />
        {inStaffArea ? null : <SiteHeader />}
        <main id="main" className="flex-1">
          {children}
        </main>
        {inStaffArea ? null : <SiteFooter />}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
