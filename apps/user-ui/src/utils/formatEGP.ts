export function formatEGP(amount: number | string): string {
  const value = typeof amount === 'string' ? Number(amount) : amount;
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '0 EGP';
  }
  return `${value.toLocaleString('en-US')} EGP`;
}

export default formatEGP;
