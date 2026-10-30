import { Button } from "@/components/ui/button";
import { ProgramCard } from "@/components/site/program-card";
import type { Audience, Program } from "@/lib/content/types";
import { audienceLabel } from "@/lib/format";

type Filter = "all" | Audience;

export function ProgramList({
  programs,
  filter,
  onFilterChange,
}: {
  programs: Program[];
  filter: Filter;
  onFilterChange: (filter: Filter) => void;
}) {
  const audiences = (["junior", "adult", "corporate"] as const).filter((a) =>
    programs.some((p) => p.audience === a),
  );
  const visible = filter === "all" ? programs : programs.filter((p) => p.audience === filter);

  return (
    <div className="flex flex-col gap-10">
      <h2 className="sr-only">Available programs</h2>
      <div role="group" aria-label="Filter programs by audience" className="flex flex-wrap gap-3">
        {(["all", ...audiences] as const).map((value) => (
          <Button
            key={value}
            size="sm"
            variant={filter === value ? "dark" : "secondary"}
            aria-pressed={filter === value}
            onClick={() => onFilterChange(value)}
          >
            {value === "all" ? "All programs" : audienceLabel[value]}
          </Button>
        ))}
      </div>
      <p className="sr-only" role="status">
        Showing {visible.length} {visible.length === 1 ? "program" : "programs"}
      </p>
      <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {visible.map((program) => (
          <li key={program.slug}>
            <ProgramCard program={program} />
          </li>
        ))}
      </ul>
    </div>
  );
}
