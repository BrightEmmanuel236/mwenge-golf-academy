import * as React from "react";
import { fieldId, type FormErrors } from "./use-form";

/** Error summary shown above a form after a failed submit. It receives focus (see useForm). */
export function FormSummary({
  errors,
  prefix,
  summaryRef,
}: {
  errors: FormErrors;
  prefix: string;
  summaryRef: React.RefObject<HTMLDivElement | null>;
}) {
  const keys = Object.keys(errors);
  if (keys.length === 0) return null;
  return (
    <div
      ref={summaryRef}
      tabIndex={-1}
      role="alert"
      className="border-danger rounded-md border bg-white p-4 text-sm outline-offset-2"
    >
      <p className="text-danger font-semibold">Please fix the following:</p>
      <ul className="mt-2 list-disc pl-5">
        {keys.map((key) => (
          <li key={key}>
            <a className="underline" href={`#${fieldId(prefix, key)}`}>
              {errors[key]}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
