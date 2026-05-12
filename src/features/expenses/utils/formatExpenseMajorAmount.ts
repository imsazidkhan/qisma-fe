export function formatExpenseMajorAmount(amountRaw: string, currency: string): string {
  const n = Number(amountRaw.replace(/,/g, ''));
  if (!Number.isFinite(n)) return amountRaw;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}
