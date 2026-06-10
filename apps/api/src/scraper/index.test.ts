import { describe, expect, it } from "vitest";
import { assertScrapeHasContent, type ScrapeResult } from "./index";

const baseScrape: ScrapeResult = {
  url: "https://example.com",
  title: "Example",
  semanticMarkdown: "",
  contentQuality: "insufficient",
  visualTokens: {
    colors: [],
    total_colors: 0,
    color_count_warning: false,
    fontFamilies: [],
    primary_font_family: null,
  },
};

describe("assertScrapeHasContent", () => {
  it("throws when semantic markdown is empty", () => {
    expect(() => assertScrapeHasContent(baseScrape)).toThrow(
      "No page content could be extracted"
    );
  });

  it("throws when semantic markdown is whitespace only", () => {
    expect(() =>
      assertScrapeHasContent({
        ...baseScrape,
        semanticMarkdown: "   \n\t  ",
      })
    ).toThrow("No page content could be extracted");
  });

  it("passes when semantic markdown has content", () => {
    expect(() =>
      assertScrapeHasContent({
        ...baseScrape,
        semanticMarkdown: "# Hello",
        contentQuality: "limited",
      })
    ).not.toThrow();
  });
});
