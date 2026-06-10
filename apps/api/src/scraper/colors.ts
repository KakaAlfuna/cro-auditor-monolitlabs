const HEX_PATTERN = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
const RGB_PATTERN = /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*[\d.]+\s*)?\)/gi;
const FONT_FAMILY_PATTERN = /font-family\s*:\s*([^;}{]+)/gi;
const BODY_FONT_PATTERN = /(?:body|html|:root)\s*\{[^}]*font-family\s*:\s*([^;}{]+)/gi;
const FONT_FACE_PATTERN = /@font-face\s*\{[^}]*font-family\s*:\s*([^;}{]+)/gi;
const GOOGLE_FONT_PATTERN = /[?&]family=([^:&]+)/g;
const CSS_VAR_COLOR_PATTERN = /--[\w-]+\s*:\s*([^;}{]+)/gi;

const BRAND_COLOR_THRESHOLD = 3;

export interface VisualTokens {
  colors: string[];
  fontFamilies: string[];
  total_colors: number;
  color_count_warning: boolean;
  primary_font_family: string | null;
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (value: number) => value.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toLowerCase();
}

function normalizeHex(hex: string): string {
  const value = hex.toLowerCase();
  if (value.length === 4) {
    return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
  }
  return value.slice(0, 7);
}

function extractColorsFromText(text: string, colors: Set<string>): void {
  const hexMatches = text.match(HEX_PATTERN) ?? [];
  for (const match of hexMatches) {
    colors.add(normalizeHex(match));
  }

  let rgbMatch: RegExpExecArray | null;
  const rgbRegex = new RegExp(RGB_PATTERN.source, RGB_PATTERN.flags);
  while ((rgbMatch = rgbRegex.exec(text)) !== null) {
    const r = Number(rgbMatch[1]);
    const g = Number(rgbMatch[2]);
    const b = Number(rgbMatch[3]);
    if (r <= 255 && g <= 255 && b <= 255) {
      colors.add(rgbToHex(r, g, b));
    }
  }
}

const GENERIC_FONT_FAMILIES = new Set([
  "inherit",
  "initial",
  "unset",
  "revert",
  "sans-serif",
  "serif",
  "monospace",
  "cursive",
  "fantasy",
  "system-ui",
  "ui-sans-serif",
  "ui-serif",
  "ui-monospace",
  "ui-rounded",
  "emoji",
  "math",
  "fangsong",
]);

function normalizeFontName(value: string): string | null {
  const primary = value
    .split(",")[0]
    .trim()
    .replace(/^['"]|['"]$/g, "");

  if (!primary || GENERIC_FONT_FAMILIES.has(primary.toLowerCase())) {
    return null;
  }

  return primary;
}

function extractFontFamiliesFromText(text: string, fonts: Set<string>): void {
  let match: RegExpExecArray | null;
  const fontRegex = new RegExp(FONT_FAMILY_PATTERN.source, FONT_FAMILY_PATTERN.flags);
  while ((match = fontRegex.exec(text)) !== null) {
    const font = normalizeFontName(match[1]);
    if (font) {
      fonts.add(font);
    }
  }

  const fontFaceRegex = new RegExp(FONT_FACE_PATTERN.source, FONT_FACE_PATTERN.flags);
  while ((match = fontFaceRegex.exec(text)) !== null) {
    const font = normalizeFontName(match[1]);
    if (font) {
      fonts.add(font);
    }
  }
}

export function extractGoogleFontFamilies(html: string): string[] {
  const fonts = new Set<string>();
  let match: RegExpExecArray | null;
  const googleFontRegex = new RegExp(GOOGLE_FONT_PATTERN.source, GOOGLE_FONT_PATTERN.flags);

  while ((match = googleFontRegex.exec(html)) !== null) {
    const font = decodeURIComponent(match[1].replace(/\+/g, " "));
    if (font) {
      fonts.add(font);
    }
  }

  return [...fonts];
}

function resolvePrimaryFontFamily(cssTexts: string[], fontFamilies: string[]): string | null {
  for (const cssText of cssTexts) {
    let match: RegExpExecArray | null;
    const bodyFontRegex = new RegExp(BODY_FONT_PATTERN.source, BODY_FONT_PATTERN.flags);
    while ((match = bodyFontRegex.exec(cssText)) !== null) {
      const font = normalizeFontName(match[1]);
      if (font) {
        return font;
      }
    }
  }

  return fontFamilies[0] ?? null;
}

export function extractVisualTokens(
  html: string,
  styleTexts: string[],
  inlineStyles: string[],
  externalStyles: string[] = []
): VisualTokens {
  const colors = new Set<string>();
  const fontFamilies = new Set<string>(extractGoogleFontFamilies(html));
  const cssTexts = [...styleTexts, ...externalStyles];

  for (const styleText of cssTexts) {
    extractColorsFromText(styleText, colors);
    extractFontFamiliesFromText(styleText, fontFamilies);

    let varMatch: RegExpExecArray | null;
    const varRegex = new RegExp(CSS_VAR_COLOR_PATTERN.source, CSS_VAR_COLOR_PATTERN.flags);
    while ((varMatch = varRegex.exec(styleText)) !== null) {
      extractColorsFromText(varMatch[1], colors);
    }
  }

  for (const inline of inlineStyles) {
    extractColorsFromText(inline, colors);
    extractFontFamiliesFromText(inline, fontFamilies);
  }

  extractColorsFromText(html, colors);

  const colorList = [...colors].sort();
  const fontList = [...fontFamilies];

  return {
    colors: colorList,
    fontFamilies: fontList,
    total_colors: colorList.length,
    color_count_warning: colorList.length > BRAND_COLOR_THRESHOLD,
    primary_font_family: resolvePrimaryFontFamily(cssTexts, fontList),
  };
}
