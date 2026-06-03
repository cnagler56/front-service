/**
 * Tiny helpers for working with NASS `short_desc` strings.
 * Kept pure so they're easy to reuse and test.
 */

/** Pull the "class" part out of a NASS short_desc — "CORN, GRAIN - YIELD…" → "GRAIN". */
export function classify(shortDesc: string | undefined): string {
  if (!shortDesc) return 'Unspecified';
  const dash = shortDesc.indexOf(' - ');
  const before = dash === -1 ? shortDesc : shortDesc.substring(0, dash);
  const comma = before.indexOf(', ');
  if (comma === -1) return 'ALL CLASSES';
  return before.substring(comma + 2).trim();
}

/** Extract "MEASURED IN BU / ACRE" → "BU / ACRE". */
export function unit(shortDesc: string | undefined): string {
  if (!shortDesc) return '';
  const m = shortDesc.match(/MEASURED IN ([^,]+)/);
  return m ? m[1].trim() : '';
}

/** Parse "175.4" or "1,234" into a number, returning null if not numeric. */
export function toNum(v: string | undefined | null): number | null {
  if (v == null) return null;
  const n = parseFloat(v.replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}
