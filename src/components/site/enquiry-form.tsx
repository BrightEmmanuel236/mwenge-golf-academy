import * as React from "react";
import Link from "@/components/app-link";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox, Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { formsConnected } from "@/lib/forms";
import { enquirySchema, type AudienceType } from "@/lib/schemas";

type Values = Record<string, string | boolean>;
type Errors = Record<string, string>;

function buildPayload(audience: AudienceType, values: Values, programSlug?: string) {
  const text = (key: string) => (typeof values[key] === "string" ? (values[key] as string) : "");
  const base = {
    audience,
    programSlug,
    name: text("name"),
    email: text("email"),
    phone: text("phone"),
    preferredStart: text("preferredStart") || undefined,
    message: text("message"),
    website: text("website"),
  };
  if (audience === "corporate") return { ...base, organization: text("organization") };
  if (audience === "junior") {
    const age = text("childAge").trim();
    return {
      ...base,
      guardianRelationship: text("guardianRelationship"),
      childFirstName: text("childFirstName"),
      childAge: age === "" ? undefined : Number(age),
      guardianDeclaration: values["guardianDeclaration"] === true,
    };
  }
  return base;
}

export function EnquiryForm({
  audience,
  programSlug,
  programTitle,
}: {
  audience: AudienceType;
  programSlug?: string;
  programTitle?: string;
}) {
  const [values, setValues] = React.useState<Values>({});
  const [errors, setErrors] = React.useState<Errors>({});
  const [submitted, setSubmitted] = React.useState(false);
  const summaryRef = React.useRef<HTMLDivElement>(null);
  const errorKeys = Object.keys(errors);

  React.useEffect(() => {
    if (Object.keys(errors).length > 0) summaryRef.current?.focus();
  }, [errors]);

  const set =
    (key: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const target = event.target;
      setValues((current) => ({
        ...current,
        [key]:
          target instanceof HTMLInputElement && target.type === "checkbox"
            ? target.checked
            : target.value,
      }));
    };

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = enquirySchema.safeParse(buildPayload(audience, values, programSlug));
    if (!result.success) {
      const next: Errors = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0] ?? "form");
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

  if (submitted) {
    return (
      <Alert tone="warning" title="Preview only: nothing was sent">
        This enquiry form is not connected yet, so your details were not sent or saved. It will be
        switched on before the website launches.
      </Alert>
    );
  }

  const err = (key: string) => errors[key];

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex flex-col gap-6"
      aria-label={`Enquiry${programTitle ? ` about ${programTitle}` : ""}`}
    >
      {errorKeys.length > 0 ? (
        <div
          ref={summaryRef}
          tabIndex={-1}
          role="alert"
          className="border-danger rounded-md border bg-white p-4 text-sm outline-offset-2"
        >
          <p className="text-danger font-semibold">Please fix the following:</p>
          <ul className="mt-2 list-disc pl-5">
            {errorKeys.map((key) => (
              <li key={key}>
                <a className="underline" href={`#enq-${key}`}>
                  {errors[key]}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {audience === "junior" ? (
        <Alert tone="info" title="Junior enquiries are made by a parent or guardian">
          Please enter your own contact details. We only ask for the child&rsquo;s first name and
          age.
        </Alert>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <Field
          id="enq-name"
          label={audience === "junior" ? "Your full name" : "Full name"}
          error={err("name")}
          required
        >
          {(a11y) => <Input {...a11y} name="name" autoComplete="name" onChange={set("name")} />}
        </Field>
        <Field id="enq-email" label="Email address" error={err("email")} required>
          {(a11y) => (
            <Input
              {...a11y}
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              onChange={set("email")}
            />
          )}
        </Field>
        <Field
          id="enq-phone"
          label="Phone number"
          hint="Include your country code if outside Uganda."
          error={err("phone")}
          required
        >
          {(a11y) => (
            <Input {...a11y} name="phone" type="tel" autoComplete="tel" onChange={set("phone")} />
          )}
        </Field>
        <Field
          id="enq-preferredStart"
          label="Preferred start"
          hint="For example, a month or a weekday."
        >
          {(a11y) => <Input {...a11y} name="preferredStart" onChange={set("preferredStart")} />}
        </Field>

        {audience === "corporate" ? (
          <Field
            id="enq-organization"
            label="Organization"
            error={err("organization")}
            required
            className="md:col-span-2"
          >
            {(a11y) => (
              <Input
                {...a11y}
                name="organization"
                autoComplete="organization"
                onChange={set("organization")}
              />
            )}
          </Field>
        ) : null}

        {audience === "junior" ? (
          <>
            <Field
              id="enq-guardianRelationship"
              label="Your relationship to the child"
              error={err("guardianRelationship")}
              required
            >
              {(a11y) => (
                <Input
                  {...a11y}
                  name="guardianRelationship"
                  onChange={set("guardianRelationship")}
                />
              )}
            </Field>
            <Field
              id="enq-childFirstName"
              label="Child's first name"
              error={err("childFirstName")}
              required
            >
              {(a11y) => <Input {...a11y} name="childFirstName" onChange={set("childFirstName")} />}
            </Field>
            <Field
              id="enq-childAge"
              label="Child's age"
              hint="Junior programs are for ages 4 to 17."
              error={err("childAge")}
              required
            >
              {(a11y) => (
                <Input
                  {...a11y}
                  name="childAge"
                  type="number"
                  inputMode="numeric"
                  min={4}
                  max={17}
                  onChange={set("childAge")}
                />
              )}
            </Field>
          </>
        ) : null}

        <Field
          id="enq-message"
          label="Message"
          error={err("message")}
          required
          className="md:col-span-2"
        >
          {(a11y) => <Textarea {...a11y} name="message" onChange={set("message")} />}
        </Field>
      </div>

      {audience === "junior" ? (
        <div className="flex flex-col gap-2">
          <label
            htmlFor="enq-guardianDeclaration"
            className="flex items-start gap-3 text-[0.9375rem]"
          >
            <Checkbox
              id="enq-guardianDeclaration"
              name="guardianDeclaration"
              aria-invalid={err("guardianDeclaration") ? true : undefined}
              aria-describedby={
                err("guardianDeclaration") ? "enq-guardianDeclaration-error" : undefined
              }
              onChange={set("guardianDeclaration")}
            />
            <span>
              I am the child&rsquo;s parent or legal guardian and I am submitting this enquiry on
              their behalf.
            </span>
          </label>
          {err("guardianDeclaration") ? (
            <p id="enq-guardianDeclaration-error" className="text-danger text-sm font-medium">
              {err("guardianDeclaration")}
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Honeypot: hidden from people and assistive technology; bots tend to fill it. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" onChange={set("website")} />
        </label>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="submit" size="lg">
          Send enquiry
        </Button>
        <p className="text-slate text-sm">
          Preview only: enquiries are not sent or saved. Read our{" "}
          <Link href="/legal/privacy" className="underline underline-offset-4">
            privacy notice
          </Link>
          .
        </p>
      </div>
    </form>
  );
}
