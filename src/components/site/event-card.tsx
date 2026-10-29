import Link from "@/components/app-link";
import { SmartImage } from "@/components/media/smart-image";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import type { AcademyEvent } from "@/lib/content/types";
import { formatDayMonth } from "@/lib/format";

const typeLabel = {
  tournament: "Tournament",
  outreach: "Outreach",
  clinic: "Clinic",
  fundraiser: "Fundraiser",
} as const;

export function EventCard({ event }: { event: AcademyEvent }) {
  const { day, month } = formatDayMonth(event.startsAt);
  return (
    <Card className="group hover:shadow-raised relative flex h-full flex-col transition-shadow duration-200">
      <SmartImage
        role="card"
        src={event.image.src}
        source={event.image.source}
        alt={event.image.alt}
        focal={event.image.focal}
      />
      <CardBody className="flex-1 flex-row gap-5">
        <time
          dateTime={event.startsAt}
          className="bg-fairway text-ivory flex size-16 shrink-0 flex-col items-center justify-center rounded-md"
        >
          <span className="font-display text-2xl leading-none font-semibold">{day}</span>
          <span className="text-xs">{month}</span>
        </time>
        <div className="flex flex-col gap-2">
          <Badge className="self-start">{typeLabel[event.type]}</Badge>
          <h3 className="text-xl">
            <Link href={`/events/${event.slug}`} className="after:absolute after:inset-0">
              {event.title}
            </Link>
          </h3>
          <p className="text-slate text-sm">{event.venue}</p>
        </div>
      </CardBody>
    </Card>
  );
}
