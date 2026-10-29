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
