import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Checkbox, Input, Textarea } from "@/components/ui/input";
import { FormSummary } from "@/components/forms/form-summary";
import { Honeypot } from "@/components/forms/honeypot";
import { PreviewNotice } from "@/components/forms/preview-notice";
import { fieldId, useForm } from "@/components/forms/use-form";
import { paymentsConnected } from "@/lib/forms";
import {
  currencies,
  currencyCodes,
  formatMoney,
  toMinorUnits,
  type CurrencyCode,
} from "@/lib/money";
import { purposeLabels } from "@/lib/content/pages";
import { donationPurposes, donationSchema, type DonationPurpose } from "@/lib/schemas";
import { cn } from "@/lib/utils";

/**
 * Suggested amounts are design defaults to be confirmed by the academy. They carry no claim
 * about what a gift buys. Values are integer minor units (UGX shillings, USD cents).
 */
const presets: Record<CurrencyCode, number[]> = {
  UGX: [50_000, 100_000, 250_000, 500_000],
  USD: [1_000, 2_500, 5_000, 10_000],
};

export function DonationForm({ initialPurpose }: { initialPurpose?: DonationPurpose | undefined }) {
  const form = useForm({
    schema: donationSchema,
    initialValues: { purpose: initialPurpose ?? "", currency: "UGX" },
    build: ({ text, flag }) => {
      const currency = (text("currency") || "UGX") as CurrencyCode;
      const custom = text("amountCustom").trim();
      const preset = text("amountPreset");
      let amountMinor: number | undefined;
      if (custom !== "") amountMinor = toMinorUnits(Number(custom), currency) ?? undefined;
      else if (preset !== "") amountMinor = Number(preset);
      return {
        purpose: text("purpose") || undefined,
        currency,
        amountMinor,
        name: text("name"),
        email: text("email"),
        phone: text("phone"),
        country: text("country"),
        message: text("message"),
        anonymous: flag("anonymous"),
        publicRecognition: flag("publicRecognition"),
        marketingOptIn: flag("marketingOptIn"),
        website: text("website"),
      };
    },
  });

  if (form.submitted) {
    return (
      <PreviewNotice>
        Online giving is not switched on yet, so no payment was taken and nothing was saved or sent.
        Thank you for your interest in supporting the academy.
      </PreviewNotice>
    );
  }

  const err = (key: string) => form.errors[key];
  const currency = (form.text("currency") || "UGX") as CurrencyCode;
  const selectedPurpose = form.text("purpose");
  const min = currencies[currency].minDonationMinor;

  return (
    <form onSubmit={form.onSubmit} noValidate aria-label="Donation" className="flex flex-col gap-8">
      <FormSummary errors={form.errors} prefix="dn" summaryRef={form.summaryRef} />

      <fieldset
        id="dn-purpose"
        tabIndex={-1}
        aria-describedby={err("purpose") ? "dn-purpose-error" : undefined}
        className="flex flex-col gap-3"
      >
        <legend className="text-ink mb-1 text-sm font-medium">
          Where should your gift go?
          <span className="text-danger ml-1" aria-hidden="true">
            *
          </span>
        </legend>
        {donationPurposes.map((purpose) => (
          <label key={purpose} className="flex items-start gap-3 text-[0.9375rem]">
            <input
              type="radio"
              name="purpose"
              value={purpose}
              defaultChecked={selectedPurpose === purpose}
              onChange={() => form.setValue("purpose", purpose)}
              className="accent-fairway mt-0.5 size-5 shrink-0"
            />
            <span>{purposeLabels[purpose]}</span>
          </label>
        ))}
        {err("purpose") ? (
          <p id="dn-purpose-error" className="text-danger text-sm font-medium">
            {err("purpose")}
          </p>
        ) : null}
      </fieldset>

      <fieldset
        id={fieldId("dn", "amountMinor")}
        tabIndex={-1}
        aria-describedby={err("amountMinor") ? "dn-amount-error" : "dn-amount-hint"}
        className="flex flex-col gap-4"
      >
        <legend className="text-ink mb-1 text-sm font-medium">
          Amount
          <span className="text-danger ml-1" aria-hidden="true">
            *
          </span>
        </legend>

        <div role="group" aria-label="Currency" className="flex gap-2">
          {currencyCodes.map((code) => (
            <Button
              key={code}
              size="sm"
              variant={currency === code ? "dark" : "secondary"}
              aria-pressed={currency === code}
              onClick={() => {
                form.setValue("currency", code);
                form.setValue("amountPreset", "");
                form.setValue("amountCustom", "");
              }}
            >
              {code}
            </Button>
          ))}
        </div>

        <div role="group" aria-label="Suggested amounts" className="flex flex-wrap gap-2">
          {presets[currency].map((minor) => {
            const selected =
              form.text("amountPreset") === String(minor) && form.text("amountCustom") === "";
            return (
              <Button
                key={minor}
                size="sm"
                variant={selected ? "dark" : "secondary"}
                aria-pressed={selected}
                onClick={() => {
                  form.setValue("amountPreset", String(minor));
                  form.setValue("amountCustom", "");
                }}
              >
                {formatMoney(minor, currency)}
              </Button>
            );
          })}
        </div>

        <Field id="dn-amountCustom" label={`Other amount (${currency})`}>
          {(a11y) => (
            <Input
              {...a11y}
              name="amountCustom"
              type="number"
              inputMode="decimal"
              min={0}
              value={form.text("amountCustom")}
              onChange={(event) => {
                form.setValue("amountCustom", event.target.value);
                if (event.target.value !== "") form.setValue("amountPreset", "");
              }}
            />
          )}
        </Field>

        <p id="dn-amount-hint" className="text-slate text-sm">
          Minimum donation: {formatMoney(min, currency)}.
        </p>
        {err("amountMinor") ? (
          <p id="dn-amount-error" className="text-danger text-sm font-medium">
            {err("amountMinor")}
          </p>
        ) : null}
      </fieldset>

      <div className="grid gap-6 md:grid-cols-2">
        <Field id="dn-name" label="Full name" error={err("name")} required>
          {(a11y) => (
            <Input {...a11y} name="name" autoComplete="name" onChange={form.bind("name")} />
          )}
        </Field>
        <Field
          id="dn-email"
          label="Email address"
          hint="Your receipt would be sent here."
          error={err("email")}
          required
        >
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
        <Field id="dn-phone" label="Phone number" error={err("phone")}>
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
        <Field id="dn-country" label="Country" error={err("country")} required>
          {(a11y) => (
            <Input
              {...a11y}
              name="country"
              autoComplete="country-name"
              onChange={form.bind("country")}
            />
          )}
        </Field>
        <Field
          id="dn-message"
          label="Message to the academy"
          error={err("message")}
          className="md:col-span-2"
        >
          {(a11y) => <Textarea {...a11y} name="message" onChange={form.bind("message")} />}
        </Field>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-ink mb-1 text-sm font-medium">Recognition and updates</legend>
        <label className="flex items-start gap-3 text-[0.9375rem]">
          <Checkbox id="dn-anonymous" name="anonymous" onChange={form.bind("anonymous")} />
          <span>Make my gift anonymous.</span>
        </label>
        <div className="flex flex-col gap-1">
          <label className="flex items-start gap-3 text-[0.9375rem]">
            <Checkbox
              id="dn-publicRecognition"
              name="publicRecognition"
              aria-invalid={err("publicRecognition") ? true : undefined}
              aria-describedby={err("publicRecognition") ? "dn-publicRecognition-error" : undefined}
              onChange={form.bind("publicRecognition")}
            />
            <span>The academy may thank me publicly on the website.</span>
          </label>
          {err("publicRecognition") ? (
            <p
              id="dn-publicRecognition-error"
              className={cn("text-danger pl-8 text-sm font-medium")}
            >
              {err("publicRecognition")}
            </p>
          ) : null}
        </div>
        <label className="flex items-start gap-3 text-[0.9375rem]">
          <Checkbox
            id="dn-marketingOptIn"
            name="marketingOptIn"
            onChange={form.bind("marketingOptIn")}
          />
          <span>Send me occasional updates from the academy.</span>
        </label>
      </fieldset>

      <Honeypot onChange={form.bind("website")} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="submit" size="lg">
          Donate
        </Button>
        {!paymentsConnected ? (
          <p className="text-slate text-sm">
            Online giving is not switched on yet; no payment will be taken.
          </p>
        ) : null}
      </div>
    </form>
  );
}
