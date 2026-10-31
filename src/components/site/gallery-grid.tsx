import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GalleryItem } from "@/lib/content/types";

/**
 * Gallery grid with a lightbox. Callers pass only items that passed the data layer's rules
 * (authentic academy media, valid licence, consent for minors); this component never filters.
 */
export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const albums = React.useMemo(() => [...new Set(items.map((item) => item.album))], [items]);
  const [album, setAlbum] = React.useState<string>("all");
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  const visible = album === "all" ? items : items.filter((item) => item.album === album);
  const current = openIndex === null ? null : (visible[openIndex] ?? null);

  function step(delta: number) {
    setOpenIndex((index) =>
      index === null || visible.length === 0
        ? index
        : (index + delta + visible.length) % visible.length,
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {albums.length > 1 ? (
        <div role="group" aria-label="Filter by album" className="flex flex-wrap gap-3">
          {["all", ...albums].map((value) => (
            <Button
              key={value}
              size="sm"
              variant={album === value ? "dark" : "secondary"}
              aria-pressed={album === value}
              onClick={() => {
                setAlbum(value);
                setOpenIndex(null);
              }}
            >
              {value === "all" ? "All photographs" : value}
            </Button>
          ))}
        </div>
      ) : null}

      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
        {visible.map((item, index) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => setOpenIndex(index)}
              className="group bg-sand relative block aspect-square w-full overflow-hidden rounded-md md:aspect-[4/3]"
            >
              <img
                src={item.media.src ?? ""}
                alt={item.media.alt}
                loading="lazy"
                decoding="async"
                className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                style={{
                  objectPosition: `${item.media.focal?.x ?? 50}% ${item.media.focal?.y ?? 50}%`,
                }}
              />
              <span className="sr-only">Open photograph</span>
            </button>
          </li>
        ))}
      </ul>

      <Dialog.Root open={current !== null} onOpenChange={(open) => !open && setOpenIndex(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="bg-night/90 fixed inset-0 z-50" />
          <Dialog.Content
            data-surface="dark"
            aria-describedby={undefined}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight") step(1);
              if (event.key === "ArrowLeft") step(-1);
            }}
            className="text-ivory fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 p-4 md:p-10"
          >
            <Dialog.Title className="sr-only">{current?.media.alt ?? "Photograph"}</Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="secondary-on-dark" size="sm" className="absolute top-4 right-4">
                <X aria-hidden="true" />
                Close
              </Button>
            </Dialog.Close>
            {current ? (
              <figure className="flex max-h-full max-w-5xl flex-col items-center gap-3">
                <img
                  src={current.media.src ?? ""}
                  alt={current.media.alt}
                  className="max-h-[75vh] w-auto max-w-full rounded-md object-contain"
                />
                <figcaption className="text-ivory/90 text-center text-sm">
                  {current.media.caption ? <span>{current.media.caption}</span> : null}
                  {current.media.credit ? (
                    <span className="block text-ivory/70">Photo: {current.media.credit}</span>
                  ) : null}
                </figcaption>
              </figure>
            ) : null}
            {visible.length > 1 ? (
              <div className="flex gap-3">
                <Button variant="secondary-on-dark" size="sm" onClick={() => step(-1)}>
                  <ChevronLeft aria-hidden="true" />
                  Previous
                </Button>
                <Button variant="secondary-on-dark" size="sm" onClick={() => step(1)}>
                  Next
                  <ChevronRight aria-hidden="true" />
                </Button>
              </div>
            ) : null}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
