import * as React from "react";
import type { ZodType } from "zod";
import { formsConnected } from "@/lib/forms";

export type FormValues = Record<string, string | boolean>;
export type FormErrors = Record<string, string>;

/** Read helpers handed to `build` so it never touches the raw values record directly. */
export interface FormReaders {
  values: FormValues;
  /** The field's text, or "" when unset. */
  text: (key: string) => string;
  /** Whether a checkbox is ticked. */
  flag: (key: string) => boolean;
}

/** DOM id for a field, derived from the form prefix and the error key (dots become hyphens). */
export const fieldId = (prefix: string, key: string) => `${prefix}-${key.replaceAll(".", "-")}`;

/**
 * Shared client-side form state: values, schema validation, an accessible error summary that
 * takes focus, and the "preview only" state used while forms are not connected (src/lib/forms.ts).
 * Validation uses the same Zod schema the server will use later.
 */
export function useForm({
  schema,
  build,
  initialValues,
}: {
  schema: ZodType;
  /** Turns raw field values into the object the schema expects. Runs on submit. */
  build: (readers: FormReaders) => unknown;
  /** Pre-filled values, for example a donation purpose chosen on the previous page. */
  initialValues?: FormValues;
}) {
  const [values, setValues] = React.useState<FormValues>(initialValues ?? {});
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [submitted, setSubmitted] = React.useState(false);
  const summaryRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (Object.keys(errors).length > 0) summaryRef.current?.focus();
  }, [errors]);

  const setValue = React.useCallback((key: string, value: string | boolean) => {
    setValues((current) => ({ ...current, [key]: value }));
  }, []);

  /** onChange handler for text inputs, textareas, selects and checkboxes. */
  const bind =
    (key: string) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const target = event.target;
      setValue(
        key,
        target instanceof HTMLInputElement && target.type === "checkbox"
          ? target.checked
          : target.value,
      );
    };

  const text = (key: string): string => {
    const value = values[key];
    return typeof value === "string" ? value : "";
  };
  const flag = (key: string): boolean => values[key] === true;

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = schema.safeParse(build({ values, text, flag }));
    if (!result.success) {
      const next: FormErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path.length > 0 ? issue.path.join(".") : "form";
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      setSubmitted(false);
      return;
    }
    setErrors({});
    // Back-end phase: send `result.data` to a server action when `formsConnected` is true.
    if (!formsConnected) setSubmitted(true);
  }

  return { values, errors, setErrors, submitted, summaryRef, setValue, bind, text, flag, onSubmit };
}
