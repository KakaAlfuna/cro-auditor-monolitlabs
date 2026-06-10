import { describe, expect, it } from "vitest";
import { assertPageIsNotBlocked, detectBlockedPage } from "./blocked-page";

describe("detectBlockedPage", () => {
  it("detects Incapsula incident pages", () => {
    const html =
      "<html><body>Request unsuccessful. Incapsula incident ID: 187000211560588534-1615612254038459758</body></html>";

    expect(detectBlockedPage(html)).toBe("Incapsula");
  });

  it("detects Cloudflare challenge pages", () => {
    const html =
      '<html><body><div id="cf-browser-verification">Just a moment... Checking your browser before accessing example.com. Cloudflare</div></body></html>';

    expect(detectBlockedPage(html)).toBe("Cloudflare");
  });

  it("returns null for normal pages", () => {
    const html = "<html><body><h1>Welcome</h1><p>Fast and reliable.</p></body></html>";

    expect(detectBlockedPage(html)).toBeNull();
  });
});

describe("assertPageIsNotBlocked", () => {
  it("throws for blocked pages", () => {
    const html =
      "<html><body>Request unsuccessful. Incapsula incident ID: 187000211560588534-1615612254038459758</body></html>";

    expect(() => assertPageIsNotBlocked(html)).toThrow(
      "This page blocked our automated audit request (Incapsula bot protection)"
    );
  });

  it("passes for normal pages", () => {
    const html = "<html><body><h1>Welcome</h1></body></html>";

    expect(() => assertPageIsNotBlocked(html)).not.toThrow();
  });
});
