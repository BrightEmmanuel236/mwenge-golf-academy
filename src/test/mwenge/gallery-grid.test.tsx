import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { GalleryGrid } from "@/components/site/gallery-grid";
import type { GalleryItem } from "@/lib/content/types";

afterEach(cleanup);

const item = (
  id: string,
  album: string,
  alt: string,
  extra: Partial<GalleryItem["media"]> = {},
): GalleryItem => ({
  id,
  album,
  media: { src: `/${id}.jpg`, alt, source: "academy", ...extra },
});

const items = [
  item("one", "Training", "Players on the practice green", {
    caption: "Practice green",
    credit: "A. Photographer",
  }),
  item("two", "Training", "A coach demonstrating a swing"),
  item("three", "Events", "Prize giving"),
];

describe("GalleryGrid", () => {
  it("renders every item with its alt text", () => {
    render(<GalleryGrid items={items} />);
    expect(screen.getByAltText("Players on the practice green")).toBeTruthy();
    expect(screen.getByAltText("Prize giving")).toBeTruthy();
  });

  it("filters by album and marks the active filter", () => {
    render(<GalleryGrid items={items} />);
    fireEvent.click(screen.getByRole("button", { name: "Events" }));
    expect(screen.getByRole("button", { name: "Events" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(screen.queryByAltText("Players on the practice green")).toBeNull();
    expect(screen.getByAltText("Prize giving")).toBeTruthy();
  });

  it("opens a lightbox with caption and credit, and steps through items", () => {
    render(<GalleryGrid items={items} />);
    fireEvent.click(within(screen.getAllByRole("listitem")[0]!).getByRole("button"));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Practice green")).toBeTruthy();
    expect(within(dialog).getByText(/A\. Photographer/)).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: /next/i }));
    expect(within(dialog).getByAltText("A coach demonstrating a swing")).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: /previous/i }));
    expect(within(dialog).getByAltText("Players on the practice green")).toBeTruthy();
  });

  it("wraps around at the ends and closes with the close button", () => {
    render(<GalleryGrid items={items} />);
    fireEvent.click(within(screen.getAllByRole("listitem")[0]!).getByRole("button"));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: /previous/i }));
    expect(within(screen.getByRole("dialog")).getByAltText("Prize giving")).toBeTruthy();
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: /close/i }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
