import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

// Match routes only (no loaders, no rendering), like the existing app-routing test.
const router = () => createRouter({ routeTree, context: { queryClient: new QueryClient() } });

describe("Phase F1 routes", () => {
  it.each([
    ["/", "/"],
    ["/about", "/about"],
    ["/programs", "/programs/"],
    ["/programs/sample-junior-program", "/programs/$slug"],
    ["/youth-development", "/youth-development"],
  ])("%s matches its own route, not the not-found fallback", (path, routeId) => {
    const matches = router().matchRoutes(path);
    const last = matches.at(-1);
    expect(last?.routeId).not.toBe(rootRouteId);
    expect(last?.routeId).toBe(routeId);
  });

  it("passes the program slug as a route param", () => {
    const last = router().matchRoutes("/programs/sample-adult-program").at(-1);
    expect(last?.params).toEqual({ slug: "sample-adult-program" });
  });
});
