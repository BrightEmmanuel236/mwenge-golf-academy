import { queryOptions } from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";
import { getEvents, getLatestNews, getProgramBySlug, getPrograms, getVerifiedImpactFigures } from "./index";

export const programsQuery = queryOptions({ queryKey: ["programs"], queryFn: getPrograms });

export const homeQuery = queryOptions({
  queryKey: ["home-content"],
  queryFn: async () => {
    const [programs, figures, events, news] = await Promise.all([
      getPrograms(), getVerifiedImpactFigures(), getEvents(), getLatestNews(3),
    ]);
    return { programs, figures, nextEvent: events.upcoming[0] ?? null, news };
  },
});

export const programQuery = (slug: string) => queryOptions({
  queryKey: ["program", slug],
  queryFn: async () => {
    const program = await getProgramBySlug(slug);
    if (!program) throw notFound();
    return { program };
  },
});