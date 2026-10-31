import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/input";
import { FormSummary } from "@/components/forms/form-summary";
import { Honeypot } from "@/components/forms/honeypot";
import { PreviewNotice } from "@/components/forms/preview-notice";
import { useForm } from "@/components/forms/use-form";
import { equipmentConditions, pledgeSchema } from "@/lib/schemas";

const conditionLabels = {
  new: "New",
  "like-new": "Like new",
  good: "Good",
  fair: "Fair",
} satisfies Record<(typeof equipmentConditions)[number], string>;

const MAX_ITEMS = 30;

export function PledgeForm() {
  // Row ids are stable keys; the schema sees the rows in on-screen order.
  const [rows, setRows] = React.useState<number[]>([0]);
  const nextRowId = React.useRef(1);

  const form = useForm({
    schema: pledgeSchema,
    build: ({ text, flag }) => ({
      name: text("name"),
      organization: text("organization"),
      email: text("email"),
      phone: text("phone"),
      originCountry: text("originCountry"),
      shippingPlan: text("shippingPlan") || undefined,
      expectedDate: text("expectedDate"),
      items: rows.map((id) => {
        const quantity = text(`item.${id}.quantity`).trim();
        return {
          description: text(`item.${id}.description`),
          quantity: quantity === "" ? undefined : Number(quantity),
          condition: text(`item.${id}.condition`) || undefined,
        };
      }),
      notes: text("notes"),
      recognitionOptIn: flag("recognitionOptIn"),
      website: text("website"),
    }),
  });

  if (form.submitted) {
    return (
      <PreviewNotice>
        This pledge form is not connected yet, so your pledge was not sent or saved. Please do not
        ship anything until the academy has confirmed what it can receive.
      </PreviewNotice>
    );
  }

  const err = (key: string) => form.errors[key];

  function addRow() {
    setRows((current) => [...current, nextRowId.current++]);
  }
  function removeRow(id: number) {
    setRows((current) => current.filter((row) => row !== id));
    form.setErrors({});
  }

  return (
    <form
      onSubmit={form.onSubmit}
      noValidate
      aria-label="Equipment pledge"
      className="flex flex-col gap-6"
    >
      <FormSummary errors={form.errors} prefix="pl" summaryRef={form.summaryRef} />

      <div className="grid gap-6 md:grid-cols-2">
        <Field id="pl-name" label="Your full name" error={err("name")} required>
          {(a11y) => (
            <Input {...a11y} name="name" autoComplete="name" onChange={form.bind("name")} />
          )}
        </Field>
        <Field id="pl-organization" label="Club or organization" error={err("organization")}>
          {(a11y) => (
            <Input
              {...a11y}
              name="organization"
              autoComplete="organization"
              onChange={form.bind("organization")}
            />
          )}
        </Field>
        <Field id="pl-email" label="Email address" error={err("email")} required>
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
        <Field id="pl-phone" label="Phone number" error={err("phone")}>
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
        <Field
          id="pl-originCountry"
          label="Country the items would ship from"
          error={err("originCountry")}
          required
        >
          {(a11y) => (
            <Input
              {...a11y}
              name="originCountry"
              autoComplete="country-name"
              onChange={form.bind("originCountry")}
            />
          )}
        </Field>
        <Field id="pl-shippingPlan" label="Shipping" error={err("shippingPlan")} required>
          {(a11y) => (
            <Select
              {...a11y}
              name="shippingPlan"
              defaultValue=""
              onChange={form.bind("shippingPlan")}
            >
              <option value="" disabled>
                How would the items reach Uganda?
              </option>
              <option value="donor-ships">I can arrange shipping</option>
              <option value="needs-help">I would need help with shipping</option>
              <option value="undecided">I have not decided yet</option>
            </Select>
          )}
        </Field>
        <Field
          id="pl-expectedDate"
          label="When could they be ready?"
          hint="For example, a month."
          error={err("expectedDate")}
        >
          {(a11y) => <Input {...a11y} name="expectedDate" onChange={form.bind("expectedDate")} />}
        </Field>
      </div>

      <div id="pl-items" tabIndex={-1} className="flex flex-col gap-4">
        <h3 className="text-xl">Items you would like to give</h3>
        {err("items") ? <p className="text-danger text-sm font-medium">{err("items")}</p> : null}
        <ul className="flex flex-col gap-4">
          {rows.map((id, index) => (
            <li key={id}>
              <fieldset className="border-line grid gap-4 rounded-md border bg-white p-4 md:grid-cols-[2fr_1fr_1fr_auto]">
                <legend className="text-slate px-1 text-sm">Item {index + 1}</legend>
                <Field
                  id={`pl-items-${index}-description`}
                  label="Description"
                  error={err(`items.${index}.description`)}
                  required
                >
                  {(a11y) => (
                    <Input
                      {...a11y}
                      name={`item-${id}-description`}
                      onChange={form.bind(`item.${id}.description`)}
                    />
                  )}
                </Field>
                <Field
                  id={`pl-items-${index}-quantity`}
                  label="Quantity"
                  error={err(`items.${index}.quantity`)}
                  required
                >
                  {(a11y) => (
                    <Input
                      {...a11y}
                      name={`item-${id}-quantity`}
                      type="number"
                      inputMode="numeric"
                      min={1}
                      onChange={form.bind(`item.${id}.quantity`)}
                    />
                  )}
                </Field>
                <Field
                  id={`pl-items-${index}-condition`}
                  label="Condition"
                  error={err(`items.${index}.condition`)}
                  required
                >
                  {(a11y) => (
                    <Select
                      {...a11y}
                      name={`item-${id}-condition`}
                      defaultValue=""
                      onChange={form.bind(`item.${id}.condition`)}
                    >
                      <option value="" disabled>
                        Choose
                      </option>
                      {equipmentConditions.map((condition) => (
                        <option key={condition} value={condition}>
                          {conditionLabels[condition]}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
                {rows.length > 1 ? (
                  <div className="flex items-end">
                    <Button
                      variant="secondary"
                      size="sm"
                      aria-label={`Remove item ${index + 1}`}
                      onClick={() => removeRow(id)}
                    >
                      <Trash2 aria-hidden="true" />
                      Remove
                    </Button>
                  </div>
                ) : null}
              </fieldset>
            </li>
          ))}
        </ul>
        <div>
          <Button
            variant="secondary"
            size="sm"
            onClick={addRow}
            disabled={rows.length >= MAX_ITEMS}
          >
            <Plus aria-hidden="true" />
            Add another item
          </Button>
        </div>
      </div>

      <Field id="pl-notes" label="Anything else the academy should know?" error={err("notes")}>
        {(a11y) => <Textarea {...a11y} name="notes" onChange={form.bind("notes")} />}
      </Field>

      <label className="flex items-start gap-3 text-[0.9375rem]">
        <Checkbox name="recognitionOptIn" onChange={form.bind("recognitionOptIn")} />
        <span>The academy may thank me or my organization publicly on the website.</span>
      </label>

      <Honeypot onChange={form.bind("website")} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="submit" size="lg">
          Submit pledge
        </Button>
        <p className="text-slate text-sm">
          Please do not ship anything until the academy confirms.
        </p>
      </div>
    </form>
  );
}
