import { ChevronDown } from "lucide-react";

/** Native disclosure elements: keyboard accessible, no JavaScript required. */
export function FaqList({ items }: { items: { question: string; answer: React.ReactNode }[] }) {
  return (
    <div className="divide-line border-line divide-y border-y">
      {items.map((item) => (
        <details key={item.question} className="group py-1">
          <summary className="font-display text-fairway flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 text-lg font-semibold [&::-webkit-details-marker]:hidden">
            {item.question}
            <ChevronDown
              className="size-5 shrink-0 transition-transform duration-200 group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <div className="measure text-slate pb-5">{item.answer}</div>
        </details>
      ))}
    </div>
  );
}
