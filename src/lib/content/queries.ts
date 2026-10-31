import { queryOptions } from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";
import {
  getAllNews,
  getEquipmentNeeds,
  getEventBySlug,
  getEvents,
  getGalleryItems,
  getLatestNews,
  getNewsBySlug,
  getPartners,
  getPublicTalentBySlug,
  getPublicTalents,
  getProgramBySlug,
  getPrograms,
  getVerifiedImpactFigures,
} from "./index";

export const programsQuery = queryOptions({ queryKey: ["programs"], queryFn: getPrograms });

export const homeQuery = queryOptions({
  queryKey: ["home-content"],
  queryFn: async () => {
    const [programs, figures, events, news] = await Promise.all([
      getPrograms(),
      getVerifiedImpactFigures(),
      getEvents(),
      getLatestNews(3),
    ]);
    return { programs, figures, nextEvent: events.upcoming[0] ?? null, news };
  },
});

export const programQuery = (slug: string) =>
  queryOptions({
    queryKey: ["program", slug],
    queryFn: async () => {
      const program = await getProgramBySlug(slug);
      if (!program) throw notFound();
      return { program };
    },
  });

export const equipmentNeedsQuery = queryOptions({
  queryKey: ["equipment-needs"],
  queryFn: getEquipmentNeeds,
});

export const partnersQuery = queryOptions({ queryKey: ["partners"], queryFn: getPartners });

export const galleryQuery = queryOptions({
  queryKey: ["gallery"],
  queryFn: () => getGalleryItems(),
});

export const eventsQuery = queryOptions({ queryKey: ["events"], queryFn: () => getEvents() });

export const eventQuery = (slug: string) =>
  queryOptions({
    queryKey: ["event", slug],
    queryFn: async () => {
      const event = await getEventBySlug(slug);
      if (!event) throw notFound();
      return { event };
    },
  });

export const newsListQuery = queryOptions({ queryKey: ["news"], queryFn: () => getAllNews() });

export const newsQuery = (slug: string) =>
  queryOptions({
    queryKey: ["news", slug],
    queryFn: async () => {
      const post = await getNewsBySlug(slug);
      if (!post) throw notFound();
      return { post };
    },
  });

export const impactQuery = queryOptions({
  queryKey: ["impact"],
  queryFn: async () => {
    const [figures, talents] = await Promise.all([getVerifiedImpactFigures(), getPublicTalents()]);
    return { figures, talents };
  },
});

export const talentQuery = (slug: string) =>
  queryOptions({
    queryKey: ["talent", slug],
    queryFn: async () => {
      const talent = await getPublicTalentBySlug(slug);
      if (!talent) throw notFound();
      return { talent };
    },
  });
