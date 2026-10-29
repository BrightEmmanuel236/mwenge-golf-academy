import { Container } from "./container";
import { Section } from "./section";
import { Breadcrumbs } from "./breadcrumbs";

/** Dark title band used by every inner page. */
export function PageHeader({
  title,
  lead,
  breadcrumbs,
  children,
}: {
  title: string;
  lead?: string;
  breadcrumbs?: { label: string; href?: string }[];
  children?: React.ReactNode;
}) {
  return (
    <Section tone="dark" space="compact" className="md:py-20">
      <Container className="flex flex-col gap-6">
        {breadcrumbs ? <Breadcrumbs items={breadcrumbs} /> : null}
        <span aria-hidden="true" className="bg-gold h-0.5 w-12" />
        <h1 className="max-w-[22ch]">{title}</h1>
        {lead ? <p className="measure text-ivory/85 text-lg md:text-xl">{lead}</p> : null}
        {children}
      </Container>
    </Section>
  );
}
