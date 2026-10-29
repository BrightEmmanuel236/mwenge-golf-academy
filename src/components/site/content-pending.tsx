/**
 * Marks a section whose real content has not been supplied yet. It is deliberately visible
 * so that unfinished content cannot reach launch unnoticed (see README "Content gaps").
 */
export function ContentPending({ what }: { what: string }) {
  return (
    <div className="border-field text-slate rounded-md border border-dashed bg-white p-6">
      <p className="text-ink font-medium">Content pending</p>
      <p className="mt-1 text-sm">{what}</p>
    </div>
  );
}
