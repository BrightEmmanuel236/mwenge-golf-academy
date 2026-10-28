import { describe, expect, it } from "vitest";
import {
  contactSchema,
  donationSchema,
  enquirySchema,
  pledgeSchema,
  sponsorSchema,
} from "@/lib/schemas";

const baseEnquiry = {
  name: "Test Parent",
  email: "Parent@Example.com ",
  phone: "+256 700 000000",
  message: "I would like to know more.",
};

describe("enquiry schema", () => {
  it("accepts an adult enquiry and normalises the email", () => {
    const result = enquirySchema.safeParse({ ...baseEnquiry, audience: "adult" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("parent@example.com");
  });

  it("requires an organization for corporate enquiries", () => {
    expect(enquirySchema.safeParse({ ...baseEnquiry, audience: "corporate" }).success).toBe(false);
    expect(
      enquirySchema.safeParse({
        ...baseEnquiry,
        audience: "corporate",
        organization: "Example Ltd",
      }).success,
    ).toBe(true);
  });

  const junior = {
    ...baseEnquiry,
    audience: "junior" as const,
    guardianRelationship: "Mother",
    childFirstName: "Sam",
    childAge: 10,
    guardianDeclaration: true as const,
  };

  it("accepts a complete junior enquiry", () => {
    expect(enquirySchema.safeParse(junior).success).toBe(true);
  });

  it("rejects junior enquiries without the guardian declaration", () => {
    expect(enquirySchema.safeParse({ ...junior, guardianDeclaration: false }).success).toBe(false);
  });

  it.each([3, 18, 10.5])("rejects invalid child age %s", (childAge) => {
    expect(enquirySchema.safeParse({ ...junior, childAge }).success).toBe(false);
  });

  it("rejects submissions that fill the honeypot", () => {
    expect(
      enquirySchema.safeParse({ ...baseEnquiry, audience: "adult", website: "http://spam" })
        .success,
    ).toBe(false);
  });
});

describe("donation schema", () => {
  const donation = {
    purpose: "talent-development" as const,
    currency: "UGX" as const,
    amountMinor: 50_000,
    name: "Donor",
    email: "donor@example.com",
    country: "Uganda",
  };

  it("accepts a valid UGX donation", () => {
    expect(donationSchema.safeParse(donation).success).toBe(true);
  });

  it("enforces the per-currency minimum", () => {
    expect(donationSchema.safeParse({ ...donation, amountMinor: 9_999 }).success).toBe(false);
    expect(
      donationSchema.safeParse({ ...donation, currency: "USD", amountMinor: 499 }).success,
    ).toBe(false);
    expect(
      donationSchema.safeParse({ ...donation, currency: "USD", amountMinor: 500 }).success,
    ).toBe(true);
  });

  it("rejects non-integer amounts", () => {
    expect(donationSchema.safeParse({ ...donation, amountMinor: 50_000.5 }).success).toBe(false);
  });

  it("rejects anonymous and public recognition together", () => {
    expect(
      donationSchema.safeParse({ ...donation, anonymous: true, publicRecognition: true }).success,
    ).toBe(false);
  });
});

describe("pledge schema", () => {
  const pledge = {
    name: "Club Captain",
    email: "club@example.com",
    originCountry: "Kenya",
    shippingPlan: "donor-ships" as const,
    items: [{ description: "Junior iron set", quantity: 4, condition: "good" as const }],
  };

  it("accepts a pledge with one valid item", () => {
    expect(pledgeSchema.safeParse(pledge).success).toBe(true);
  });

  it("requires at least one item and positive quantities", () => {
    expect(pledgeSchema.safeParse({ ...pledge, items: [] }).success).toBe(false);
    expect(
      pledgeSchema.safeParse({
        ...pledge,
        items: [{ description: "Bag", quantity: 0, condition: "new" }],
      }).success,
    ).toBe(false);
  });
});

describe("sponsor and contact schemas", () => {
  it("requires at least one sponsor interest", () => {
    const sponsor = {
      organization: "Example Ltd",
      name: "A Person",
      email: "a@example.com",
      message: "Interested.",
    };
    expect(sponsorSchema.safeParse({ ...sponsor, interests: [] }).success).toBe(false);
    expect(sponsorSchema.safeParse({ ...sponsor, interests: ["event-sponsorship"] }).success).toBe(
      true,
    );
  });

  it("accepts an empty optional phone on the contact form", () => {
    expect(
      contactSchema.safeParse({
        name: "A",
        email: "a@example.com",
        phone: "",
        topic: "other",
        message: "Hello",
      }).success,
    ).toBe(true);
  });
});
