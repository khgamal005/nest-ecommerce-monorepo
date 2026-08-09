export function formatEGP(amount: number): string {
  if (typeof amount !== 'number' || Number.isNaN(amount)) {
    return '0 EGP';
  }
  return `${amount.toLocaleString('en-US')} EGP`;
}