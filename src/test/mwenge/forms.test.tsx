import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ContactForm } from "@/components/site/contact-form";
import { DonationForm } from "@/components/site/donation-form";
import { PledgeForm } from "@/components/site/pledge-form";
import { SponsorForm } from "@/components/site/sponsor-form";

afterEach(cleanup);

const type = (label: RegExp | string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
const submit = (name: RegExp | string) => fireEvent.click(screen.getByRole("button", { name }));

describe("ContactForm", () => {
  it("shows a focused error summary for an empty submit", () => {
    render(<ContactForm />);
    submit(/send message/i);
    const summary = screen.getByRole("alert");
    expect(within(summary).getByText(/please fix the following/i)).toBeTruthy();
    expect(within(summary).getByText("Name is required.")).toBeTruthy();
    expect(within(summary).getByText("Choose what your message is about.")).toBeTruthy();
    expect(document.activeElement).toBe(summary);
  });

  it("links each summary entry to its field", () => {
    render(<ContactForm />);
    submit(/send message/i);
    const link = within(screen.getByRole("alert")).getByText("Name is required.");
    expect(link.getAttribute("href")).toBe("#ct-name");
    expect(document.getElementById("ct-name")).not.toBeNull();
  });

  it("shows an honest preview state, not a success message, after a valid submit", () => {
    render(<ContactForm />);
    type(/full name/i, "Test Person");
    type(/email address/i, "test@example.com");
    type(/what is your message about/i, "training");
    type(/^message/i, "Hello");
    submit(/send message/i);
    expect(screen.getByText("Preview only: nothing was sent")).toBeTruthy();
    expect(screen.queryByText(/message sent|thank you for contacting/i)).toBeNull();
  });
});

describe("SponsorForm", () => {
  it("requires at least one area of interest", () => {
    render(<SponsorForm />);
    submit(/send enquiry/i);
    expect(
      within(screen.getByRole("alert")).getByText("Choose at least one area of interest."),
    ).toBeTruthy();
  });

  it("accepts a complete enquiry and shows the preview state", () => {
    render(<SponsorForm />);
    type(/^organization/i, "Example Ltd");
    type(/your full name/i, "A Person");
    type(/email address/i, "a@example.com");
    fireEvent.click(screen.getByLabelText("Event sponsorship"));
    type(/^message/i, "We would like to help.");
    submit(/send enquiry/i);
    expect(screen.getByText("Preview only: nothing was sent")).toBeTruthy();
  });
});

describe("PledgeForm", () => {
  it("adds and removes item rows", () => {
    render(<PledgeForm />);
    expect(screen.getAllByText(/^Item \d$/)).toHaveLength(1);
    expect(screen.queryByRole("button", { name: /remove item/i })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /add another item/i }));
    expect(screen.getAllByText(/^Item \d$/)).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: /remove item 2/i }));
    expect(screen.getAllByText(/^Item \d$/)).toHaveLength(1);
  });

  it("reports row-level errors in the summary", () => {
    render(<PledgeForm />);
    submit(/submit pledge/i);
    const summary = screen.getByRole("alert");
    expect(within(summary).getByText("Describe the item.")).toBeTruthy();
    expect(within(summary).getByText("Enter a quantity.")).toBeTruthy();
    expect(within(summary).getByText("Describe the item.").getAttribute("href")).toBe(
      "#pl-items-0-description",
    );
  });

  it("accepts a valid pledge and warns the donor not to ship yet", () => {
    render(<PledgeForm />);
    type(/your full name/i, "Club Captain");
    type(/email address/i, "club@example.com");
    type(/country the items would ship from/i, "Kenya");
    type(/^shipping/i, "donor-ships");
    type(/^description/i, "Junior iron set");
    type(/^quantity/i, "4");
    type(/^condition/i, "good");
    submit(/submit pledge/i);
    expect(screen.getByText("Preview only: nothing was sent")).toBeTruthy();
    expect(screen.getByText(/do not ship anything/i)).toBeTruthy();
  });
});

describe("DonationForm", () => {
  const fillDonor = () => {
    type(/full name/i, "Donor Person");
    type(/email address/i, "donor@example.com");
    type(/^country/i, "Uganda");
  };

  it("requires a purpose and an amount", () => {
    render(<DonationForm />);
    submit(/^donate$/i);
    const summary = screen.getByRole("alert");
    expect(within(summary).getByText("Choose where your gift should go.")).toBeTruthy();
    expect(within(summary).getByText("Enter an amount.")).toBeTruthy();
  });

  it("pre-selects a purpose passed from the previous page", () => {
    render(<DonationForm initialPurpose="talent-development" />);
    expect((screen.getByLabelText("Talent development") as HTMLInputElement).checked).toBe(true);
  });

  it("enforces the per-currency minimum", () => {
    render(<DonationForm initialPurpose="equipment" />);
    fillDonor();
    type(/other amount/i, "5000");
    submit(/^donate$/i);
    expect(
      within(screen.getByRole("alert")).getByText("The minimum donation is UGX 10,000."),
    ).toBeTruthy();
  });

  it("switching currency clears the chosen amount", () => {
    render(<DonationForm initialPurpose="equipment" />);
    fireEvent.click(screen.getByRole("button", { name: /UGX\s*50,000/ }));
    expect(screen.getByRole("button", { name: /UGX\s*50,000/ }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: "USD" }));
    expect(screen.getByRole("button", { name: "USD" }).getAttribute("aria-pressed")).toBe("true");
    for (const button of screen
      .getByRole("group", { name: /suggested amounts/i })
      .querySelectorAll("button")) {
      expect(button.getAttribute("aria-pressed")).toBe("false");
    }
  });

  it("rejects anonymous and public recognition together", () => {
    render(<DonationForm initialPurpose="equipment" />);
    fillDonor();
    fireEvent.click(screen.getByRole("button", { name: /UGX\s*50,000/ }));
    fireEvent.click(screen.getByLabelText(/make my gift anonymous/i));
    fireEvent.click(screen.getByLabelText(/thank me publicly/i));
    submit(/^donate$/i);
    expect(
      within(screen.getByRole("alert")).getByText(
        "Choose either anonymous or public recognition, not both.",
      ),
    ).toBeTruthy();
  });

  it("never claims a payment was taken or a gift received while payments are not connected", () => {
    render(<DonationForm initialPurpose="equipment" />);
    fillDonor();
    fireEvent.click(screen.getByRole("button", { name: /UGX\s*50,000/ }));
    submit(/^donate$/i);
    expect(screen.getByText("Preview only: nothing was sent")).toBeTruthy();
    expect(screen.getByText(/no payment was taken/i)).toBeTruthy();
    expect(
      screen.queryByText(/gift (has been )?received|payment (was )?successful|donation complete/i),
    ).toBeNull();
  });
});
