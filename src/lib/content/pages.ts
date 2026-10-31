/**
 * Page copy that comes straight from the client's concept brief. Anything that needs facts the
 * client has not supplied (history, leadership, coaches, figures, venues, policy detail) is NOT
 * written here; it renders as pending content or is omitted. See README, "Content gaps".
 */
export const pillars = [
  {
    title: "Identify",
    short: "Spotting young golf talent in schools and communities.",
    long: "Through school and community golf outreach, the academy looks for young people with talent and enthusiasm for the game.",
  },
  {
    title: "Train",
    short: "Professional coaching for juniors, adults and corporate clients.",
    long: "Structured training that helps young golfers build their skills, and offers coaching to adults and corporate teams too.",
  },
  {
    title: "Mentor",
    short: "Guidance for young people on and off the course.",
    long: "Coaches and mentors support young golfers as people as well as players, helping them grow in confidence.",
  },
  {
    title: "Equip",
    short: "Clubs and training materials for those who need them.",
    long: "Donations of equipment and training materials, locally and from abroad, help young golfers get what they need to play.",
  },
] as const;

export const youthFaq = [
  {
    question: "How do I enrol my child?",
    answer:
      "Send an enquiry from a junior program page. A parent or guardian completes the form, and the academy contacts you to talk through the next steps.",
  },
  {
    question: "How much do junior programs cost?",
    answer:
      "Fees are confirmed by the academy when you enquire, and shown on each program page once they are published.",
  },
  {
    question: "Will my child’s photograph or story be published?",
    answer:
      "Photographs and stories of young people are published only with a parent or guardian’s written consent, and consent can be withdrawn at any time.",
  },
  {
    question: "Who can I speak to if I have a concern about my child’s safety?",
    answer:
      "Use the contact page to reach the academy directly. Safeguarding concerns are treated as a priority.",
  },
] as const;

/** Donation purposes as shown to donors. Keys come from the shared donation schema. */
export const purposeLabels = {
  "talent-development": "Talent development",
  equipment: "Equipment",
  outreach: "Outreach",
  "where-needed": "Where it is needed most",
} as const;

/**
 * Legal pages are structure only. The wording must come from the academy and its legal adviser
 * (PRD 10.2, "VERIFY"); no legal text is written here.
 */
export const legalPages = [
  {
    slug: "privacy",
    title: "Privacy policy",
    description: "How Mwenge Golf Academy collects, uses and protects personal information.",
    outline: [
      "What information the academy collects",
      "How the information is used",
      "Information about children",
      "Sharing and storing information",
      "Your choices and rights",
      "How to contact the academy about your information",
    ],
  },
  {
    slug: "terms",
    title: "Terms of use",
    description: "The terms for using the Mwenge Golf Academy website.",
    outline: [
      "Using this website",
      "Programs and bookings",
      "Donations and equipment pledges",
      "Intellectual property",
      "Changes to these terms",
      "Contact",
    ],
  },
  {
    slug: "safeguarding",
    title: "Safeguarding and child protection",
    description: "How Mwenge Golf Academy protects the young people it works with.",
    outline: [
      "The academy's commitment",
      "Who is responsible for safeguarding",
      "How to raise a concern",
      "Photographs and stories of young people",
      "Consent, and how to withdraw it",
      "Contact",
    ],
  },
  {
    slug: "cookies",
    title: "Cookies and analytics",
    description: "How the Mwenge Golf Academy website uses cookies and measures visits.",
    outline: ["What the website stores on your device", "How visits are measured", "Your choices"],
  },
  {
    slug: "donation-terms",
    title: "Donation and refund terms",
    description: "The terms that apply to donations and equipment pledges.",
    outline: ["Donations", "Refunds and cancellations", "Receipts", "Equipment pledges", "Contact"],
  },
] as const;

export type LegalSlug = (typeof legalPages)[number]["slug"];
