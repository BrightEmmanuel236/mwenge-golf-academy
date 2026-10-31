import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { FormSummary } from "@/components/forms/form-summary";
import { Honeypot } from "@/components/forms/honeypot";
import { PreviewNotice } from "@/components/forms/preview-notice";
import { useForm } from "@/components/forms/use-form";
import { contactSchema, contactTopics } from "@/lib/schemas";

const topicLabels: Record<(typeof contactTopics)[number], string> = {
  training: "Training and programs",
  youth: "Junior and youth development",
  donation: "Donations",
  equipment: "Equipment",
  partnership: "Sponsorship or partnership",
  media: "Media",
  other: "Something else",
};

export function ContactForm() {
  const form = useForm({
    schema: contactSchema,
    build: ({ text }) => ({
      name: text("name"),
      email: text("email"),
      phone: text("phone"),
      topic: text("topic") || undefined,
      message: text("message"),
      website: text("website"),
    }),
  });

  if (form.submitted) {
    return (
      <PreviewNotice>
        This contact form is not connected yet, so your message was not sent or saved. It will be
        switched on before the website launches.
      </PreviewNotice>
    );
  }

  const err = (key: string) => form.errors[key];

  return (
    <form
      onSubmit={form.onSubmit}
      noValidate
      aria-label="Contact the academy"
      className="flex flex-col gap-6"
    >
      <FormSummary errors={form.errors} prefix="ct" summaryRef={form.summaryRef} />
      <div className="grid gap-6 md:grid-cols-2">
        <Field id="ct-name" label="Full name" error={err("name")} required>
          {(a11y) => (
            <Input {...a11y} name="name" autoComplete="name" onChange={form.bind("name")} />
          )}
        </Field>
        <Field id="ct-email" label="Email address" error={err("email")} required>
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
        <Field id="ct-phone" label="Phone number" error={err("phone")}>
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
        <Field id="ct-topic" label="What is your message about?" error={err("topic")} required>
          {(a11y) => (
            <Select {...a11y} name="topic" defaultValue="" onChange={form.bind("topic")}>
              <option value="" disabled>
                Choose a topic
              </option>
              {contactTopics.map((topic) => (
                <option key={topic} value={topic}>
                  {topicLabels[topic]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field
          id="ct-message"
          label="Message"
          error={err("message")}
          required
          className="md:col-span-2"
        >
          {(a11y) => <Textarea {...a11y} name="message" onChange={form.bind("message")} />}
        </Field>
      </div>
      <Honeypot onChange={form.bind("website")} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="submit" size="lg">
          Send message
        </Button>
        <p className="text-slate text-sm">We reply within one business day.</p>
      </div>
    </form>
  );
}
