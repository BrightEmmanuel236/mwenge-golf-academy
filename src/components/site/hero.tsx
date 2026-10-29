import Link from "@/components/app-link";
import { Container } from "@/components/layout/container";
import { SmartImage } from "@/components/media/smart-image";
import { Button } from "@/components/ui/button";
import type { MediaRef } from "@/lib/content/media";

export function Hero({
  image,
  title,
  lead,
  primary,
  secondary,
}: {
  image: MediaRef;
  title: string;
  lead: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
}) {
  return (
    <section data-surface="dark" className="bg-night text-ivory relative">
      <div className="relative min-h-[600px] md:h-[min(88vh,800px)] md:min-h-[620px]">
        <SmartImage
          role="hero"
          priority
          overlay="hero"
          src={image.src}
          source={image.source}
          alt={image.alt}
          focal={image.focal}
          className="absolute inset-0 aspect-auto h-full"
        />
        <div className="absolute inset-0 flex items-end">
          <Container className="pb-10 md:pb-20">
            <div className="flex max-w-[44rem] flex-col gap-6">
              <span aria-hidden="true" className="bg-gold h-0.5 w-12" />
              <h1>{title}</h1>
              <p className="text-ivory/90 text-lg md:text-xl">{lead}</p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href={primary.href}>{primary.label}</Link>
                </Button>
                <Button asChild size="lg" variant="secondary-on-dark">
                  <Link href={secondary.href}>{secondary.label}</Link>
                </Button>
              </div>
            </div>
          </Container>
        </div>
      </div>
    </section>
  );
}
