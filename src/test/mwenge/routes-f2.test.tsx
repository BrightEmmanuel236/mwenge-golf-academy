import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

const router = () => createRouter({ routeTree, context: { queryClient: new QueryClient() } });

describe("Phase F2 routes", () => {
  it.each([
    ["/contact", "/contact"],
    ["/support", "/support/"],
    ["/support/donate", "/support/donate/"],
    ["/support/donate/thank-you", "/support/donate/thank-you"],
    ["/support/equipment", "/support/equipment"],
    ["/support/sponsor", "/support/sponsor"],
    ["/impact", "/impact/"],
    ["/impact/talents/some-slug", "/impact/talents/$slug"],
    ["/events", "/events/"],
    ["/events/sample-outreach-day", "/events/$slug"],
    ["/news", "/news/"],
    ["/news/sample-announcement", "/news/$slug"],
    ["/gallery", "/gallery"],
    ["/partners", "/partners"],
    ["/legal/privacy", "/legal/$slug"],
  ])("%s matches %s", (path, routeId) => {
    const last = router().matchRoutes(path).at(-1);
    expect(last?.routeId).not.toBe(rootRouteId);
    expect(last?.routeId).toBe(routeId);
  });

  it("every footer legal link resolves to the legal route", () => {
    for (const slug of ["privacy", "terms", "safeguarding", "cookies", "donation-terms"]) {
      expect(router().matchRoutes(`/legal/${slug}`).at(-1)?.routeId).toBe("/legal/$slug");
    }
  });
});
