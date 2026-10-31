import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Checkbox, Input, Textarea } from "@/components/ui/input";
import { FormSummary } from "@/components/forms/form-summary";
import { Honeypot } from "@/components/forms/honeypot";
import { PreviewNotice } from "@/components/forms/preview-notice";
import { useForm } from "@/components/forms/use-form";
import { sponsorInterests, sponsorSchema } from "@/lib/schemas";

const interestLabels = {
  "event-sponsorship": "Event sponsorship",
  "program-sponsorship": "Program sponsorship",
  "equipment-partnership": "Equipment partnership",
  "corporate-training": "Corporate training",
  other: "Something else",
} satisfies Record<(typeof sponsorInterests)[number], string>;

export function SponsorForm() {
  const form = useForm({
    schema: sponsorSchema,
    build: ({ text, flag }) => ({
      organization: text("organization"),
      name: text("name"),
      email: text("email"),
      phone: text("phone"),
      interests: sponsorInterests.filter((interest) => flag(`interest:${interest}`)),
      message: text("message"),
      website: text("website"),
    }),
  });

  if (form.submitted) {
    return (
      <PreviewNotice>
        This partnership form is not connected yet, so your details were not sent or saved. It will
        be switched on before the website launches.
      </PreviewNotice>
    );
  }

  const err = (key: string) => form.errors[key];

  return (
    <form
      onSubmit={form.onSubmit}
      noValidate
      aria-label="Sponsor or partner enquiry"
      className="flex flex-col gap-6"
    >
      <FormSummary errors={form.errors} prefix="sp" summaryRef={form.summaryRef} />
      <div className="grid gap-6 md:grid-cols-2">
        <Field
          id="sp-organization"
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
              onChange={form.bind("organization")}
            />
          )}
        </Field>
        <Field id="sp-name" label="Your full name" error={err("name")} required>
          {(a11y) => (
            <Input {...a11y} name="name" autoComplete="name" onChange={form.bind("name")} />
          )}
        </Field>
        <Field id="sp-email" label="Email address" error={err("email")} required>
          {(a11y) => (
            <Input
              {...a11y}
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              onChange={form.bind("email")}
            />
          )}
        </Field>
        <Field id="sp-phone" label="Phone number" error={err("phone")}>
          {(a11y) => (
            <Input
              {...a11y}
              name="phone"
              type="tel"
              autoComplete="tel"
              onChange={form.bind("phone")}
            />
          )}
        </Field>
      </div>

      <fieldset
        id="sp-interests"
        tabIndex={-1}
        aria-describedby={err("interests") ? "sp-interests-error" : undefined}
        className="flex flex-col gap-3"
      >
        <legend className="text-ink mb-1 text-sm font-medium">
          Areas of interest
          <span className="text-danger ml-1" aria-hidden="true">
            *
          </span>
        </legend>
        {sponsorInterests.map((interest) => (
          <label key={interest} className="flex items-start gap-3 text-[0.9375rem]">
            <Checkbox name={`interest-${interest}`} onChange={form.bind(`interest:${interest}`)} />
            <span>{interestLabels[interest]}</span>
          </label>
        ))}
        {err("interests") ? (
          <p id="sp-interests-error" className="text-danger text-sm font-medium">
            {err("interests")}
          </p>
        ) : null}
      </fieldset>

      <Field id="sp-message" label="Message" error={err("message")} required>
        {(a11y) => <Textarea {...a11y} name="message" onChange={form.bind("message")} />}
      </Field>
      <Honeypot onChange={form.bind("website")} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="submit" size="lg">
          Send enquiry
        </Button>
        <p className="text-slate text-sm">The academy will follow up with you directly.</p>
      </div>
    </form>
  );
}
