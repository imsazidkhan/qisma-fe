/**
 * Pulls short human-readable fragments from server `displayText` for “recent context” UI.
 * Best-effort only — no structured expense list on this endpoint yet.
 */
export function parseRelationshipHintsFromDisplayText(raw: string, maxHints = 3): string[] {
  const s = raw.trim();
  if (s.length === 0) {
    return [];
  }

  const chunks = s
    .split(/\r?\n|•|·|\||;/)
    .map((p) => p.trim())
    .filter((p) => p.length > 2 && p.length < 120);

  const uniq: string[] = [];
  for (const c of chunks) {
    if (!uniq.includes(c)) {
      uniq.push(c);
    }
    if (uniq.length >= maxHints) {
      break;
    }
  }

  return uniq;
}
