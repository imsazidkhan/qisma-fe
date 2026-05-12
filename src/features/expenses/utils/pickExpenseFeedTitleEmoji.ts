/** Lightweight title → glyph hints for feed / activity rows (best-effort). */
export function pickExpenseFeedTitleEmoji(title: string): string {
  const s = title.toLowerCase();
  if (/\bpizza\b|🍕|dinner|lunch|breakfast|food|cafe|coffee|drink|beer|wine/.test(s)) {
    return '🍕';
  }
  if (/uber|lyft|taxi|cab|train|flight|bus|metro|gas|fuel|parking|car/.test(s)) {
    return '🚗';
  }
  if (/rent|lease|utility|electric|water|wifi|internet/.test(s)) {
    return '🏠';
  }
  if (/hotel|airbnb|stay|trip|travel|visa/.test(s)) {
    return '✈️';
  }
  return '🧾';
}
