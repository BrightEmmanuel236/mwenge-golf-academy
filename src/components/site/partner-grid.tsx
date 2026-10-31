import type { Partner } from "@/lib/content/types";

/** Partners and sponsors. Callers pass only partners whose written permission is on record. */
export function PartnerGrid({ partners }: { partners: Partner[] }) {
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {partners.map((partner) => (
        <li
          key={partner.name}
          className="border-line flex flex-col gap-3 rounded-md border bg-white p-6"
        >
          {partner.logo?.src ? (
            <img
              src={partner.logo.src}
              alt={partner.logo.alt}
              loading="lazy"
              decoding="async"
              className="h-16 w-auto max-w-full self-start object-contain"
            />
          ) : null}
          <h3 className="text-xl">
            {partner.website ? (
              <a
                href={partner.website}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-canopy underline-offset-4 hover:underline"
              >
                {partner.name}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            ) : (
              partner.name
            )}
          </h3>
          {partner.description ? <p className="text-slate">{partner.description}</p> : null}
        </li>
      ))}
    </ul>
  );
}
