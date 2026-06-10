import { describe, expect, it } from "vitest";
import { deduplicateMarkdownLines, htmlToSemanticMarkdown } from "./markdown";

describe("htmlToSemanticMarkdown", () => {
  it("converts headings and CTA buttons to semantic markdown", () => {
    const html = `
      <header>
        <h1>Welcome</h1>
        <button>Get Started</button>
      </header>
      <main>
        <h2>Features</h2>
        <p>Fast and reliable.</p>
        <a href="/signup" class="btn-primary">Sign Up Now</a>
      </main>
    `;

    const markdown = htmlToSemanticMarkdown(html);

    expect(markdown).toContain("# Welcome");
    expect(markdown).toContain("[CTA Button: Get Started]");
    expect(markdown).toContain("## Features");
    expect(markdown).toContain("[CTA Button: Sign Up Now]");
    expect(markdown).toContain("[SECTION: HEADER]");
  });

  it("strips scripts, svgs, and class attributes", () => {
    const html = `
      <div class="wrapper noisy">
        <script>alert('x')</script>
        <svg><circle /></svg>
        <p class="lead">Content</p>
      </div>
    `;

    const markdown = htmlToSemanticMarkdown(html);

    expect(markdown).not.toContain("alert");
    expect(markdown).not.toContain("circle");
    expect(markdown).not.toContain("class=");
    expect(markdown).toContain("Content");
  });

  it("adds metadata fallback when static body content is sparse", () => {
    const html = `
      <html>
        <head>
          <meta name="description" content="A conversion-focused landing page." />
          <meta property="og:title" content="Landing Page" />
        </head>
        <body><div id="root"></div></body>
      </html>
    `;

    const markdown = htmlToSemanticMarkdown(html);

    expect(markdown).toContain("[Limited static HTML detected");
    expect(markdown).toContain("[Meta Description: A conversion-focused landing page.]");
    expect(markdown).toContain("[Open Graph Title: Landing Page]");
  });

  it("removes duplicate blocks from carousel or marquee clones", () => {
    const html = `
      <main>
        <div class="slide"><h2>BUILD SMARTER BUSINESSES</h2></div>
        <div class="slide"><h2>BUILD SMARTER BUSINESSES</h2></div>
        <div class="slide"><h2>BUILD SMARTER BUSINESSES</h2></div>
        <div class="slide"><h2>BUILD SMARTER BUSINESSES</h2></div>
        <p>We design modern websites and intelligent systems.</p>
        <p>We design modern websites and intelligent systems.</p>
        <p>We design modern websites and intelligent systems.</p>
        <ul>
          <li>AI AUTOMATION</li>
          <li>AI AUTOMATION</li>
          <li>AI AUTOMATION</li>
          <li>STRATEGY</li>
        </ul>
      </main>
    `;

    const markdown = htmlToSemanticMarkdown(html);

    expect(markdown.match(/## BUILD SMARTER BUSINESSES/g)).toHaveLength(1);
    expect(
      markdown.match(/We design modern websites and intelligent systems\./g)
    ).toHaveLength(1);
    expect(markdown.match(/- AI AUTOMATION/g)).toHaveLength(1);
    expect(markdown).toContain("- STRATEGY");
  });

  it("keeps distinct blocks that only repeat a shared heading", () => {
    const html = `
      <main>
        <section>
          <h3>1</h3>
          <h4>WHAT YOU GET</h4>
          <p>A clear plan and design concept.</p>
        </section>
        <section>
          <h3>2</h3>
          <h4>WHAT YOU GET</h4>
          <p>A fully functional platform with automation.</p>
        </section>
      </main>
    `;

    const markdown = htmlToSemanticMarkdown(html);

    expect(markdown.match(/### WHAT YOU GET/g)).toHaveLength(1);
    expect(markdown).toContain("A clear plan and design concept.");
    expect(markdown).toContain("A fully functional platform with automation.");
  });
});

describe("deduplicateMarkdownLines", () => {
  it("removes repeated lines regardless of surrounding whitespace", () => {
    const input = "### Hero\n\n### Hero\n\nBody copy\n\nBody   copy\n\n### Footer";

    expect(deduplicateMarkdownLines(input)).toBe("### Hero\n\nBody copy\n\n### Footer");
  });
});
