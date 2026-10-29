import Link from "@/components/app-link";
import { SmartImage } from "@/components/media/smart-image";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import type { Program } from "@/lib/content/types";
import { audienceLabel, programPrice } from "@/lib/format";

export function ProgramCard({ program }: { program: Program }) {
  return (
    <Card className="group hover:shadow-raised relative flex h-full flex-col transition-shadow duration-200">
      <SmartImage
        role="card"
        src={program.image.src}
        source={program.image.source}
        alt={program.image.alt}
        focal={program.image.focal}
      />
      <CardBody className="flex-1">
        <Badge variant={program.audience === "junior" ? "earth" : "neutral"} className="self-start">
          {audienceLabel[program.audience]}
        </Badge>
        <h3 className="text-2xl">
          {/* The whole card is the link target via the stretched ::after. */}
          <Link href={`/programs/${program.slug}`} className="after:absolute after:inset-0">
            {program.title}
          </Link>
        </h3>
        <p className="text-slate">{program.summary}</p>
        <p className="text-fairway mt-auto pt-2 text-sm font-medium">{programPrice(program)}</p>
      </CardBody>
    </Card>
  );
}
