import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// These tests run with saving switched ON; forms.test.tsx covers the default (preview) state.
vi.mock("@/lib/forms", () => ({ formsConnected: true, paymentsConnected: false }));
const sendSubmission = vi.fn();
vi.mock("@/lib/submit-client", () => ({
  sendSubmission: (...args: unknown[]) => sendSubmission(...args),
}));
vi.mock("@/components/app-link", () => ({
  default: ({ href, children, ...rest }: { href: string; children?: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { ContactForm } from "@/components/site/contact-form";
import { DonationForm } from "@/components/site/donation-form";
import { EnquiryForm } from "@/components/site/enquiry-form";

beforeEach(() => sendSubmission.mockReset());
afterEach(cleanup);

const type = (label: RegExp | string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
const fillContact = () => {
  type(/full name/i, "Test Person");
  type(/email address/i, "test@example.com");
  type(/what is your message about/i, "training");
  type(/^message/i, "Hello");
};
const press = (name: RegExp) => fireEvent.click(screen.getByRole("button", { name }));

describe("ContactForm with saving on", () => {
  it("shows the reference only after the server confirms the save", async () => {
    sendSubmission.mockResolvedValue({ ok: true, reference: "MGA-MSG-2026-0042" });
    render(<ContactForm />);
    fillContact();
    press(/send message/i);
    await waitFor(() => expect(screen.getByText("MGA-MSG-2026-0042")).toBeTruthy());
    expect(sendSubmission).toHaveBeenCalledWith(
      "contact",
      expect.objectContaining({ email: "test@example.com", topic: "training" }),
    );
    expect(screen.queryByText("Preview only: nothing was sent")).toBeNull();
  });

  it("moves focus to the confirmation", async () => {
    sendSubmission.mockResolvedValue({ ok: true, reference: "MGA-MSG-2026-0043" });
    render(<ContactForm />);
    fillContact();
    press(/send message/i);
    await waitFor(() => expect(screen.getByText("MGA-MSG-2026-0043")).toBeTruthy());
    expect(document.activeElement?.textContent).toContain("MGA-MSG-2026-0043");
  });

  it("says plainly that nothing was sent when saving fails, and keeps what was typed", async () => {
    sendSubmission.mockResolvedValue({
      ok: false,
      reason: "unavailable",
      message: "Something went wrong on our side. Nothing was sent. Please try again in a moment.",
    });
    render(<ContactForm />);
    fillContact();
    press(/send message/i);
    await waitFor(() => expect(screen.getByText("Not sent")).toBeTruthy());
    expect(screen.getByText(/nothing was sent\. please try again/i)).toBeTruthy();
    expect(screen.queryByText(/we have received/i)).toBeNull();
    expect((screen.getByLabelText(/full name/i) as HTMLInputElement).value).toBe("Test Person");
    expect((screen.getByLabelText(/^message/i) as HTMLTextAreaElement).value).toBe("Hello");
  });

  it("puts server field errors in the focused summary", async () => {
    sendSubmission.mockResolvedValue({
      ok: false,
      reason: "invalid",
      message: "Some details need fixing. Nothing was sent.",
      fieldErrors: { email: "Enter a valid email address." },
    });
    render(<ContactForm />);
    fillContact();
    press(/send message/i);
    await waitFor(() =>
      expect(screen.getAllByText("Enter a valid email address.")).toHaveLength(2),
    );
    const summaryLink = screen
      .getAllByText("Enter a valid email address.")
      .find((element) => element.tagName === "A");
    expect(summaryLink?.getAttribute("href")).toBe("#ct-email");
  });

  it("disables the button while sending, so a double click cannot send twice", async () => {
    let finish: (value: unknown) => void = () => undefined;
    sendSubmission.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    render(<ContactForm />);
    fillContact();
    press(/send message/i);
    const busy = await screen.findByRole("button", { name: /sending/i });
    expect((busy as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(busy);
    expect(sendSubmission).toHaveBeenCalledTimes(1);
    finish({ ok: true, reference: "MGA-MSG-2026-0044" });
    await waitFor(() => expect(screen.getByText("MGA-MSG-2026-0044")).toBeTruthy());
  });

  it("does not call the server when the form is invalid", () => {
    render(<ContactForm />);
    press(/send message/i);
    expect(sendSubmission).not.toHaveBeenCalled();
  });
});

describe("EnquiryForm with saving on", () => {
  const fill = () => {
    type(/full name/i, "Ada Test");
    type(/email address/i, "ada@example.com");
    type(/phone number/i, "+256700000001");
    type(/^message/i, "I would like to start");
  };

  it("saves, shows the reference, and no longer says 'preview only' near the button", async () => {
    sendSubmission.mockResolvedValue({ ok: true, reference: "MGA-ENQ-2026-0007" });
    render(<EnquiryForm audience="adult" programSlug="adult-lessons" />);
    expect(screen.queryByText(/preview only/i)).toBeNull();
    fill();
    press(/send enquiry/i);
    await waitFor(() => expect(screen.getByText("MGA-ENQ-2026-0007")).toBeTruthy());
    expect(sendSubmission).toHaveBeenCalledWith(
      "enquiry",
      expect.objectContaining({ audience: "adult", programSlug: "adult-lessons" }),
    );
  });

  it("reports a failure as not sent", async () => {
    sendSubmission.mockResolvedValue({
      ok: false,
      reason: "rate_limited",
      message: "Too many. Nothing was sent.",
    });
    render(<EnquiryForm audience="adult" />);
    fill();
    press(/send enquiry/i);
    await waitFor(() => expect(screen.getByText("Not sent")).toBeTruthy());
    expect(screen.queryByText(/we have received/i)).toBeNull();
  });
});

describe("DonationForm stays preview-only even with saving on", () => {
  it("never calls the submission server", () => {
    render(<DonationForm />);
    press(/donate|give|continue/i);
    expect(sendSubmission).not.toHaveBeenCalled();
  });
});
