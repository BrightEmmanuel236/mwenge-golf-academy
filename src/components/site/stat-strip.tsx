import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import type { ImpactFigure } from "@/lib/content/types";
import { formatDate } from "@/lib/format";

export function StatStrip({ figures }: { figures: ImpactFigure[] }) {
  if (figures.length === 0) return null;
  const latest = figures
    .map((f) => f.asAt)
    .sort()
    .at(-1)!;
  return (
    <Section tone="sand" space="compact">
      <Container>
        <dl className="grid gap-8 sm:grid-cols-3">
          {figures.slice(0, 3).map((figure) => (
            <div
              key={figure.label}
              className="border-gold flex flex-col-reverse gap-1 border-t-2 pt-4"
            >
              <dt className="text-slate">{figure.label}</dt>
              <dd className="font-display text-fairway text-4xl font-semibold md:text-5xl">
                {figure.value}
              </dd>
            </div>
          ))}
        </dl>
        <p className="text-slate mt-6 text-sm">Figures as at {formatDate(latest)}.</p>
      </Container>
    </Section>
  );
}
