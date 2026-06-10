import { describe, expect, it } from "vitest";
import { extractVisualTokens } from "./colors";

describe("extractVisualTokens", () => {
  it("flags color_count_warning when more than 3 distinct colors are found", () => {
    const html = `
      <style>
        :root { --primary: #ff0000; --secondary: #00ff00; }
        body { color: #0000ff; background: #ffff00; }
      </style>
      <p style="border-color: #ff00ff">Hello</p>
    `;

    const result = extractVisualTokens(html, [":root { --primary: #ff0000; --secondary: #00ff00; }"], ["border-color: #ff00ff"]);

    expect(result.total_colors).toBeGreaterThan(3);
    expect(result.color_count_warning).toBe(true);
  });

  it("does not warn when three or fewer colors are detected", () => {
    const result = extractVisualTokens(
      "",
      ["body { color: #111111; background: #ffffff; }"],
      ["border-color: #222222"]
    );

    expect(result.total_colors).toBe(3);
    expect(result.color_count_warning).toBe(false);
  });

  it("extracts primary font family from CSS", () => {
    const result = extractVisualTokens(
      "",
      ["body { font-family: 'Inter', sans-serif; }"],
      []
    );

    expect(result.primary_font_family).toBe("Inter");
    expect(result.fontFamilies).toContain("Inter");
  });

  it("prefers body font-family over unrelated CSS rules", () => {
    const result = extractVisualTokens(
      "",
      [
        ".hero { font-family: 'Comic Sans MS', cursive; }",
        "body { font-family: 'Inter', sans-serif; }",
      ],
      []
    );

    expect(result.primary_font_family).toBe("Inter");
  });

  it("extracts Google Fonts families from HTML links", () => {
    const html = `
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&family=Open+Sans&display=swap">
    `;

    const result = extractVisualTokens(html, [], []);

    expect(result.fontFamilies).toEqual(expect.arrayContaining(["Roboto", "Open Sans"]));
    expect(result.primary_font_family).toBe("Roboto");
  });
});
