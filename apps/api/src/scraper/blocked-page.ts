interface BlockedPageSignature {
  provider: string;
  test: (html: string) => boolean;
}

const BLOCKED_PAGE_SIGNATURES: BlockedPageSignature[] = [
  {
    provider: "Incapsula",
    test: (html) =>
      /incapsula incident id/i.test(html) ||
      /_Incapsula_Resource/i.test(html) ||
      (/request unsuccessful/i.test(html) && /incapsula/i.test(html)),
  },
  {
    provider: "Cloudflare",
    test: (html) =>
      /cf-browser-verification/i.test(html) ||
      /challenge-platform/i.test(html) ||
      /cdn-cgi\/challenge-platform/i.test(html) ||
      (/just a moment/i.test(html) && /cloudflare/i.test(html)),
  },
  {
    provider: "Akamai",
    test: (html) =>
      /akamai ghost/i.test(html) ||
      (/access denied/i.test(html) && /akamai/i.test(html)),
  },
];

export function detectBlockedPage(html: string): string | null {
  for (const signature of BLOCKED_PAGE_SIGNATURES) {
    if (signature.test(html)) {
      return signature.provider;
    }
  }

  return null;
}

export function assertPageIsNotBlocked(html: string): void {
  const provider = detectBlockedPage(html);
  if (!provider) {
    return;
  }

  throw new Error(
    `This page blocked our automated audit request (${provider} bot protection). Please try a URL that can be accessed without WAF challenges.`
  );
}
