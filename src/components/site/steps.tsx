/** Numbered "how it works" list. Steps are plain text so each page owns its own wording. */
export function Steps({ items }: { items: { title: string; body: string }[] }) {
  return (
    <ol className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
      {items.map((item, index) => (
        <li key={item.title} className="flex flex-col gap-3">
          <span
            aria-hidden="true"
            className="bg-fairway text-ivory font-display flex size-10 items-center justify-center rounded-full font-semibold"
          >
            {index + 1}
          </span>
          <h3 className="text-xl">{item.title}</h3>
          <p className="text-slate">{item.body}</p>
        </li>
      ))}
    </ol>
  );
}
