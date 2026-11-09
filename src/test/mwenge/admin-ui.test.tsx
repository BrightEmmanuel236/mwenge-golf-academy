import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({
  readSnapshot: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  verifiedFactorId: vi.fn(),
  beginEnrollment: vi.fn(),
  verifyCode: vi.fn(),
}));
const queries = vi.hoisted(() => ({
  listSubmissions: vi.fn(),
  getDetail: vi.fn(),
  loadHistory: vi.fn(),
  saveSubmission: vi.fn(),
  loadCounts: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }) },
  },
}));
vi.mock("@/lib/admin/auth", () => auth);
vi.mock("@/lib/admin/queries", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/admin/queries")>()),
  ...queries,
}));
vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-router")>()),
  Link: ({
    children,
    to,
    params,
  }: {
    children?: React.ReactNode;
    to: string;
    params?: Record<string, string>;
  }) => (
    <a href={String(to).replace(/\$(\w+)/g, (_m, key: string) => params?.[key] ?? "")}>
      {children}
    </a>
  ),
}));

import { AdminGate } from "@/components/admin/admin-gate";
import { Dashboard } from "@/components/admin/dashboard";
import { LoginFlow } from "@/components/admin/login-flow";
import { SubmissionDetail } from "@/components/admin/submission-detail";
import { SubmissionList } from "@/components/admin/submission-list";
import { StaffProvider, type StaffState } from "@/lib/admin/staff-context";
import type { Detail } from "@/lib/admin/queries";

const wrap = (node: React.ReactNode) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{node}</QueryClientProvider>;
};

beforeEach(() => {
  for (const mock of [...Object.values(auth), ...Object.values(queries)]) mock.mockReset();
  auth.signOut.mockResolvedValue(undefined);
});
afterEach(cleanup);

describe("sign-in flow", () => {
  const signedOut = { step: "signin", email: null, roles: [] };
  const type = (label: RegExp | string, value: string) =>
    fireEvent.change(screen.getByLabelText(label), { target: { value } });

  it("starts with the password form, after a brief check", async () => {
    auth.readSnapshot.mockResolvedValue(signedOut);
    render(
      <StaffProvider>
        <LoginFlow onSignedIn={() => {}} />
      </StaffProvider>,
    );
    expect(screen.getByRole("status").textContent).toContain("Checking your sign-in");
    expect(await screen.findByRole("form", { name: "Staff sign-in" })).toBeTruthy();
  });

  it("asks for both fields, and gives one generic message for a wrong password", async () => {
    auth.readSnapshot.mockResolvedValue(signedOut);
    auth.signIn.mockResolvedValue({ ok: false, message: "Email or password is incorrect." });
    render(
      <StaffProvider>
        <LoginFlow onSignedIn={() => {}} />
      </StaffProvider>,
    );
    await screen.findByRole("form", { name: "Staff sign-in" });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("Enter your email and password.")).toBeTruthy();
    expect(auth.signIn).not.toHaveBeenCalled();
    type(/email address/i, "someone@example.org");
    type(/^password/i, "wrong");
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() => expect(screen.getByText("Email or password is incorrect.")).toBeTruthy());
    expect(auth.signIn).toHaveBeenCalledWith("someone@example.org", "wrong");
  });

  it("goes password -> code -> in, and only reports success after the code is accepted", async () => {
    auth.readSnapshot
      .mockResolvedValueOnce(signedOut)
      .mockResolvedValueOnce({ step: "verify", email: "s@x.org", roles: [] })
      .mockResolvedValueOnce({ step: "ready", email: "s@x.org", roles: ["academy_admin"] });
    auth.signIn.mockResolvedValue({ ok: true });
    auth.verifiedFactorId.mockResolvedValue("factor-1");
    auth.verifyCode.mockResolvedValue({ ok: true });
    const done = vi.fn();
    render(
      <StaffProvider>
        <LoginFlow onSignedIn={done} />
      </StaffProvider>,
    );
    await screen.findByRole("form", { name: "Staff sign-in" });
    type(/email address/i, "s@x.org");
    type(/^password/i, "pw");
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await screen.findByRole("form", { name: "Second step" });
    expect(done).not.toHaveBeenCalled();
    await waitFor(() =>
      expect((screen.getByRole("button", { name: "Sign in" }) as HTMLButtonElement).disabled).toBe(
        false,
      ),
    );
    type(/6-digit code/i, "123 456");
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => expect(done).toHaveBeenCalled());
    expect(auth.verifyCode).toHaveBeenCalledWith("factor-1", "123 456");
  });

  it("keeps the person on the code step and clears the field when the code is wrong", async () => {
    auth.readSnapshot.mockResolvedValue({ step: "verify", email: "s@x.org", roles: [] });
    auth.verifiedFactorId.mockResolvedValue("factor-1");
    auth.verifyCode.mockResolvedValue({
      ok: false,
      message: "That code is not correct or has expired.",
    });
    const done = vi.fn();
    render(
      <StaffProvider>
        <LoginFlow onSignedIn={done} />
      </StaffProvider>,
    );
    await screen.findByRole("form", { name: "Second step" });
    await waitFor(() =>
      expect((screen.getByRole("button", { name: "Sign in" }) as HTMLButtonElement).disabled).toBe(
        false,
      ),
    );
    type(/6-digit code/i, "000000");
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() =>
      expect(screen.getByText("That code is not correct or has expired.")).toBeTruthy(),
    );
    expect((screen.getByLabelText(/6-digit code/i) as HTMLInputElement).value).toBe("");
    expect(done).not.toHaveBeenCalled();
  });

  it("sets up an authenticator on first sign-in: QR code, typed key, then a code", async () => {
    auth.readSnapshot
      .mockResolvedValueOnce({ step: "enroll", email: "s@x.org", roles: [] })
      .mockResolvedValue({ step: "ready", email: "s@x.org", roles: ["super_admin"] });
    auth.beginEnrollment.mockResolvedValue({
      ok: true,
      factorId: "f2",
      qrCode: "data:image/svg+xml;utf8,<svg/>",
      secret: "ABCD EFGH",
    });
    auth.verifyCode.mockResolvedValue({ ok: true });
    const done = vi.fn();
    render(
      <StaffProvider>
        <LoginFlow onSignedIn={done} />
      </StaffProvider>,
    );
    await screen.findByRole("form", { name: "Set up your authenticator" });
    expect(screen.getByAltText(/QR code/i)).toBeTruthy();
    expect(screen.getByText("ABCD EFGH")).toBeTruthy();
    type(/6-digit code/i, "654321");
    fireEvent.click(screen.getByRole("button", { name: "Finish setup" }));
    await waitFor(() => expect(done).toHaveBeenCalled());
    expect(auth.verifyCode).toHaveBeenCalledWith("f2", "654321");
  });

  it("explains plainly when setup cannot start, and offers another account", async () => {
    auth.readSnapshot.mockResolvedValue({ step: "enroll", email: "s@x.org", roles: [] });
    auth.beginEnrollment.mockResolvedValue({
      ok: false,
      message: "Something went wrong. Please try again.",
    });
    render(
      <StaffProvider>
        <LoginFlow onSignedIn={() => {}} />
      </StaffProvider>,
    );
    await screen.findByText("Setup could not start");
    fireEvent.click(screen.getByRole("button", { name: "Use a different account" }));
    await waitFor(() => expect(auth.signOut).toHaveBeenCalled());
  });

  it("treats a failed sign-in check as signed out, never as signed in", async () => {
    auth.readSnapshot.mockRejectedValue(new Error("network"));
    const done = vi.fn();
    render(
      <StaffProvider>
        <LoginFlow onSignedIn={done} />
      </StaffProvider>,
    );
    await screen.findByRole("form", { name: "Staff sign-in" });
    expect(done).not.toHaveBeenCalled();
  });
});

describe("staff area gate", () => {
  const staff = (over: Partial<StaffState> = {}): StaffState => ({
    loading: false,
    step: "ready",
    email: "ops@academy.org",
    roles: ["academy_admin"],
    refresh: vi.fn().mockResolvedValue(undefined),
    ...over,
  });
  const gate = (s: StaffState, onLoginPage = false, onNeedLogin = vi.fn()) =>
    render(
      <AdminGate onLoginPage={onLoginPage} staff={s} onNeedLogin={onNeedLogin}>
        <p>SECRET CONTENT</p>
      </AdminGate>,
    );

  it("shows nothing while checking", () => {
    gate(staff({ loading: true }));
    expect(screen.queryByText("SECRET CONTENT")).toBeNull();
    expect(screen.getByRole("status").textContent).toContain("Checking");
  });
  it.each(["signin", "verify", "enroll"] as const)(
    "sends a person at step '%s' to the sign-in page and shows no content",
    (step) => {
      const needLogin = vi.fn();
      gate(staff({ step, roles: [] }), false, needLogin);
      expect(needLogin).toHaveBeenCalled();
      expect(screen.queryByText("SECRET CONTENT")).toBeNull();
    },
  );
  it("lets the sign-in screen itself through without redirecting", () => {
    const needLogin = vi.fn();
    gate(staff({ step: "signin", roles: [] }), true, needLogin);
    expect(screen.getByText("SECRET CONTENT")).toBeTruthy();
    expect(needLogin).not.toHaveBeenCalled();
  });
  it("shows nothing from a staff screen for a signed-out person, even for one render (the redirect gap)", () => {
    // While a redirect is under way the staff screen is still the matched route: it must not render.
    gate(staff({ step: "signin", roles: [] }), false);
    expect(screen.queryByText("SECRET CONTENT")).toBeNull();
  });
  it("frames a signed-in person's pages with their email, role and navigation", () => {
    gate(staff());
    expect(screen.getByText("SECRET CONTENT")).toBeTruthy();
    expect(screen.getByText("ops@academy.org")).toBeTruthy();
    expect(screen.getByText("Academy administrator")).toBeTruthy();
    expect(
      within(screen.getByRole("navigation", { name: "Staff area" })).getAllByRole("link"),
    ).toHaveLength(5);
  });
  it("explains an account with no role instead of showing content", () => {
    gate(staff({ roles: [] }));
    expect(screen.queryByText("SECRET CONTENT")).toBeNull();
    expect(screen.getByText("No staff role on this account")).toBeTruthy();
    expect(screen.queryByRole("navigation", { name: "Staff area" })).toBeNull();
  });
  it("keeps submissions away from a content manager", () => {
    gate(staff({ roles: ["content_manager"] }));
    expect(screen.queryByText("SECRET CONTENT")).toBeNull();
    expect(screen.getByText("Your role does not include submissions")).toBeTruthy();
  });
  it("signs out and re-reads the state", async () => {
    const s = staff();
    gate(s);
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    await waitFor(() => expect(auth.signOut).toHaveBeenCalled());
    await waitFor(() => expect(s.refresh).toHaveBeenCalled());
  });
});

describe("list", () => {
  const row = (over = {}) => ({
    reference: "MGA-ENQ-2026-0001",
    status: "new",
    createdAt: "2026-10-26T07:00:00Z",
    name: "Ada",
    summary: "adult",
    restricted: false,
    ...over,
  });
  const show = (props: Partial<React.ComponentProps<typeof SubmissionList>> = {}) =>
    render(
      wrap(
        <SubmissionList
          kind="enquiry"
          status={undefined}
          page={0}
          onFilter={() => {}}
          onPage={() => {}}
          {...props}
        />,
      ),
    );

  it("lists records with links, status, an Overdue word for old new ones, and Restricted for safeguarding", async () => {
    queries.listSubmissions.mockResolvedValue({
      ok: true,
      data: {
        total: 2,
        rows: [row(), row({ reference: "MGA-MSG-2026-0002", status: "closed", restricted: true })],
      },
    });
    show();
    const table = await screen.findByRole("table");
    expect(
      within(table).getByRole("link", { name: "MGA-ENQ-2026-0001" }).getAttribute("href"),
    ).toBe("/admin/enquiries/MGA-ENQ-2026-0001");
    expect(within(table).getAllByText("Overdue")).toHaveLength(1);
    expect(within(table).getByText("Restricted")).toBeTruthy();
    expect(screen.getByText("1–2 of 2")).toBeTruthy();
  });
  it("says when there is nothing, and when it could not load", async () => {
    queries.listSubmissions.mockResolvedValueOnce({ ok: true, data: { total: 0, rows: [] } });
    show();
    expect(await screen.findByText("Nothing to show here.")).toBeTruthy();
    cleanup();
    queries.listSubmissions.mockResolvedValueOnce({
      ok: false,
      message: "The list could not be loaded. Try again.",
    });
    show();
    expect(await screen.findByText("Could not load the list")).toBeTruthy();
  });
  it("filters by status and pages", async () => {
    queries.listSubmissions.mockResolvedValue({ ok: true, data: { total: 60, rows: [row()] } });
    const onFilter = vi.fn();
    const onPage = vi.fn();
    show({ onFilter, onPage, page: 1 });
    await screen.findByRole("table");
    fireEvent.change(screen.getByLabelText("Show"), { target: { value: "contacted" } });
    expect(onFilter).toHaveBeenCalledWith("contacted");
    fireEvent.change(screen.getByLabelText("Show"), { target: { value: "" } });
    expect(onFilter).toHaveBeenLastCalledWith(undefined);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(onPage).toHaveBeenCalledWith(2);
    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    expect(onPage).toHaveBeenCalledWith(0);
  });
  it("disables Previous on the first page and Next on the last", async () => {
    queries.listSubmissions.mockResolvedValue({ ok: true, data: { total: 3, rows: [row()] } });
    show();
    await screen.findByRole("table");
    expect((screen.getByRole("button", { name: "Previous" }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect((screen.getByRole("button", { name: "Next" }) as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("record page", () => {
  const detail = (over: Partial<Detail> = {}): Detail => ({
    kind: "enquiry",
    reference: "MGA-ENQ-2026-0001",
    status: "new",
    notes: "",
    createdAt: new Date().toISOString(),
    restricted: false,
    hasChildDetails: false,
    fields: [
      { label: "Name", value: "Ada" },
      { label: "Message", value: "Hello there" },
    ],
    items: [],
    ...over,
  });
  const open = (kind: "enquiry" | "contact" | "pledge" = "enquiry") =>
    render(wrap(<SubmissionDetail kind={kind} reference="MGA-ENQ-2026-0001" />));
  beforeEach(() =>
    queries.loadHistory.mockResolvedValue({ ok: true, data: { history: [], emails: [] } }),
  );

  it("shows the sender's details", async () => {
    queries.getDetail.mockResolvedValue({ ok: true, data: detail() });
    open();
    expect(await screen.findByRole("heading", { name: "MGA-ENQ-2026-0001" })).toBeTruthy();
    expect(screen.getByText("Hello there")).toBeTruthy();
    expect(screen.queryByText("Includes a child's details")).toBeNull();
  });
  it("warns that a junior enquiry includes a child's details", async () => {
    queries.getDetail.mockResolvedValue({
      ok: true,
      data: detail({
        hasChildDetails: true,
        fields: [{ label: "Child's first name", value: "Kai" }],
      }),
    });
    open();
    expect(await screen.findByText("Includes a child's details")).toBeTruthy();
    expect(screen.getByText("Kai")).toBeTruthy();
  });
  it("marks a safeguarding report as restricted", async () => {
    queries.getDetail.mockResolvedValue({
      ok: true,
      data: detail({ kind: "contact", restricted: true }),
    });
    open("contact");
    expect(await screen.findByText("Safeguarding report")).toBeTruthy();
  });
  it("lists pledge items", async () => {
    queries.getDetail.mockResolvedValue({
      ok: true,
      data: detail({
        kind: "pledge",
        items: [{ description: "Irons", quantity: 4, condition: "good" }],
      }),
    });
    open("pledge");
    expect(await screen.findByText("Irons")).toBeTruthy();
  });
  it("says plainly when the record is missing or not allowed", async () => {
    queries.getDetail.mockResolvedValue({
      ok: false,
      message: "This record was not found, or your role does not allow you to see it.",
    });
    open();
    expect(await screen.findByText("Record not available")).toBeTruthy();
    expect(screen.getByText(/not found, or your role does not allow/)).toBeTruthy();
  });

  it("only offers to save once something changed, then saves status and notes", async () => {
    queries.getDetail
      .mockResolvedValueOnce({ ok: true, data: detail() })
      .mockResolvedValue({ ok: true, data: detail({ status: "contacted", notes: "Called back" }) });
    queries.saveSubmission.mockResolvedValue({ ok: true });
    open();
    const save = await screen.findByRole("button", { name: "Save changes" });
    expect((save as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(/^status/i), { target: { value: "contacted" } });
    fireEvent.change(screen.getByLabelText(/internal notes/i), {
      target: { value: "Called back" },
    });
    expect((save as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(save);
    await waitFor(() =>
      expect(queries.saveSubmission).toHaveBeenCalledWith("enquiry", "MGA-ENQ-2026-0001", {
        status: "contacted",
        notes: "Called back",
      }),
    );
    expect(await screen.findByText("Saved.")).toBeTruthy();
  });
  it("never says 'Saved' when the save was refused, and keeps what was typed", async () => {
    queries.getDetail.mockResolvedValue({ ok: true, data: detail() });
    queries.saveSubmission.mockResolvedValue({
      ok: false,
      message:
        "Your role does not allow you to change this record, or it no longer exists. Nothing was changed.",
    });
    open();
    await screen.findByRole("button", { name: "Save changes" });
    fireEvent.change(screen.getByLabelText(/internal notes/i), { target: { value: "My note" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("Not saved")).toBeTruthy();
    expect(screen.getByText(/Nothing was changed/)).toBeTruthy();
    expect(screen.queryByText("Saved.")).toBeNull();
    expect((screen.getByLabelText(/internal notes/i) as HTMLTextAreaElement).value).toBe("My note");
  });
  it("shows who changed what, and the email delivery status", async () => {
    queries.getDetail.mockResolvedValue({ ok: true, data: detail() });
    queries.loadHistory.mockResolvedValue({
      ok: true,
      data: {
        history: [
          {
            at: "2026-11-05T09:00:00Z",
            actor: "ops@academy.org",
            description: "changed the status from New to Contacted",
          },
        ],
        emails: [
          { label: "Staff notification", status: "sent", detail: "sent today" },
          {
            label: "Confirmation to the sender",
            status: "failed",
            detail: "not sent (http_500); it will be retried",
          },
        ],
      },
    });
    open();
    expect(
      await screen.findByText(/ops@academy.org changed the status from New to Contacted/),
    ).toBeTruthy();
    expect(screen.getByText(/will be retried/)).toBeTruthy();
  });
});

describe("dashboard", () => {
  it("shows new and overdue counts, and says when a role cannot see a list", async () => {
    queries.loadCounts.mockResolvedValue({
      enquiry: { newCount: 3, overdueCount: 1 },
      contact: { newCount: 0, overdueCount: 0 },
      sponsor: null,
      pledge: { newCount: 2, overdueCount: 0 },
    });
    render(wrap(<Dashboard />));
    expect(await screen.findByText("1 overdue")).toBeTruthy();
    expect(screen.getAllByText("Not available for your role.")).toHaveLength(1);
    expect(screen.getAllByRole("link").map((a) => a.getAttribute("href"))).toEqual([
      "/admin/enquiries",
      "/admin/messages",
      "/admin/sponsors",
      "/admin/pledges",
    ]);
  });
});
