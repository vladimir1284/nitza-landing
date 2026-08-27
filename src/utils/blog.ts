const FIRST_IMAGE_RE = /!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/;

export function extractHeroImage(body: string | undefined): string | undefined {
  return body?.match(FIRST_IMAGE_RE)?.[1];
}
