import Link from "@/components/app-link";
import { SmartImage } from "@/components/media/smart-image";
import { Card, CardBody } from "@/components/ui/card";
import type { PublicTalent } from "@/lib/content/consent";

/** Card for a published (consented) talent profile. Receives only the public projection. */
export function TalentCard({ talent }: { talent: PublicTalent }) {
  const photo = talent.photo;
  return (
    <Card className="group hover:shadow-raised relative flex h-full flex-col transition-shadow duration-200">
      {photo?.src ? (
        <SmartImage
          role="portrait"
          src={photo.src}
          source={photo.source}
          alt={photo.alt}
          focal={photo.focal}
        />
      ) : (
        <SmartImage role="portrait" src={null} source="academy" decorative emptyLabel="" />
      )}
      <CardBody>
        <h3 className="text-xl">
          <Link href={`/impact/talents/${talent.slug}`} className="after:absolute after:inset-0">
            {talent.displayName}
          </Link>
        </h3>
        <p className="text-slate text-sm">Age {talent.ageBand}</p>
        {talent.achievements[0] ? <p className="text-slate">{talent.achievements[0]}</p> : null}
      </CardBody>
    </Card>
  );
}
