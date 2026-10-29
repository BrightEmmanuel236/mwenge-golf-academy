import { cn } from "@/lib/utils";
import { Container } from "./container";
import { Section } from "./section";

/** Editorial image-and-text layout. The image side flips on desktop with `reverse`. */
export function FeatureSplit({
  media,
  children,
  reverse = false,
  tone = "ivory",
}: {
  media: React.ReactNode;
  children: React.ReactNode;
  reverse?: boolean;
  tone?: "ivory" | "sand" | "white";
}) {
  return (
    <Section tone={tone}>
      <Container>
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
          <div className={cn(reverse && "md:order-2")}>{media}</div>
          <div className={cn("flex flex-col gap-6", reverse && "md:order-1")}>{children}</div>
        </div>
      </Container>
    </Section>
  );
}
