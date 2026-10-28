/** Palette shown on the style guide. Tests verify these match the CSS tokens in globals.css. */
export interface Swatch {
  token: string; // CSS variable name without the leading --color-
  name: string;
  hex: string;
  use: string;
  /** Tailwind background class (literal so Tailwind can detect it). */
  bg: string;
  lightText: boolean;
}

export const swatches: Swatch[] = [
  {
    token: "night",
    name: "Course Night",
    hex: "#08261c",
    use: "Overlays, footer, deepest surfaces",
    bg: "bg-night",
    lightText: true,
  },
  {
    token: "fairway",
    name: "Fairway Green",
    hex: "#0e3b2c",
    use: "Primary: dark sections, buttons",
    bg: "bg-fairway",
    lightText: true,
  },
  {
    token: "canopy",
    name: "Canopy",
    hex: "#1f6b4a",
    use: "Links and focus on light surfaces",
    bg: "bg-canopy",
    lightText: true,
  },
  {
    token: "gold",
    name: "Muted Gold",
    hex: "#c9a24a",
    use: "Call-to-action fill, rules, text on dark",
    bg: "bg-gold",
    lightText: false,
  },
  {
    token: "gold-ink",
    name: "Antique Gold",
    hex: "#8a6a1f",
    use: "Gold-toned text on ivory only",
    bg: "bg-gold-ink",
    lightText: true,
  },
  {
    token: "earth",
    name: "Red Earth",
    hex: "#b5532f",
    use: "Youth and impact accents, sparingly",
    bg: "bg-earth",
    lightText: true,
  },
  {
    token: "ivory",
    name: "Ivory",
    hex: "#faf8f3",
    use: "Page background",
    bg: "bg-ivory",
    lightText: false,
  },
  {
    token: "sand",
    name: "Sand",
    hex: "#f0ece2",
    use: "Alternate sections",
    bg: "bg-sand",
    lightText: false,
  },
  {
    token: "line",
    name: "Line",
    hex: "#ddd7c8",
    use: "Dividers and card borders",
    bg: "bg-line",
    lightText: false,
  },
  {
    token: "field",
    name: "Field border",
    hex: "#857e6b",
    use: "Form control borders (3:1 minimum)",
    bg: "bg-field",
    lightText: true,
  },
  {
    token: "ink",
    name: "Ink",
    hex: "#1b1f1d",
    use: "Body text and headings",
    bg: "bg-ink",
    lightText: true,
  },
  {
    token: "slate",
    name: "Slate",
    hex: "#4a524e",
    use: "Secondary text",
    bg: "bg-slate",
    lightText: true,
  },
];
