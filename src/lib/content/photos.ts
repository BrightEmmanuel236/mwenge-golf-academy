import type { MediaRef } from "./media";

// Served from public/photos so they work on any host (Vercel included).
const bagOnTheGreen = { url: "/photos/bag-on-the-green.webp" };
const ballInGrass = { url: "/photos/ball-in-grass.webp" };
const courseWithTrolleys = { url: "/photos/course-with-trolleys.webp" };
const golferFollowThrough = { url: "/photos/golfer-follow-through.webp" };
const golferFullSwing = { url: "/photos/golfer-full-swing.webp" };
const golferSunsetSilhouette = { url: "/photos/golfer-sunset-silhouette.webp" };
const putterAtTheHole = { url: "/photos/putter-at-the-hole.webp" };
const rollingCourseGreen = { url: "/photos/rolling-course-green.webp" };

/**
 * Interim photo library (stand-in until the admin media library in Supabase Storage, PRD 7.7).
 * These are general golf photographs supplied by the client, NOT academy photography, so they are
 * marked `placeholder`: they show a "Placeholder image" label and are blocked from Gallery,
 * Impact and Events by the data layer (PRD 7.6). Replace each with an admin-managed image later.
 */
const photo = (src: string, alt: string, focal?: { x: number; y: number }): MediaRef => ({
  src,
  alt,
  source: "placeholder",
  ...(focal ? { focal } : {}),
});

export const photos = {
  golferFullSwing: photo(
    golferFullSwing.url,
    "Golfer at the top of a full swing on a sunny fairway",
    { x: 45, y: 40 },
  ),
  golferSunsetSilhouette: photo(
    golferSunsetSilhouette.url,
    "Silhouette of a golfer finishing a swing at sunset",
    { x: 62, y: 45 },
  ),
  rollingCourseGreen: photo(rollingCourseGreen.url, "Rolling green golf course under a clear sky"),
  golferFollowThrough: photo(
    golferFollowThrough.url,
    "Golfer following through after a drive on an open course",
    { x: 60, y: 40 },
  ),
  putterAtTheHole: photo(putterAtTheHole.url, "Putter lining up a ball beside the hole", {
    x: 50,
    y: 65,
  }),
  bagOnTheGreen: photo(bagOnTheGreen.url, "Golf bag standing on a green near the flag", {
    x: 30,
    y: 55,
  }),
  courseWithTrolleys: photo(
    courseWithTrolleys.url,
    "Golf trolleys and a flag on a tree-lined course",
  ),
  ballInGrass: photo(ballInGrass.url, "Close-up of a golf ball resting in grass"),
} satisfies Record<string, MediaRef>;
