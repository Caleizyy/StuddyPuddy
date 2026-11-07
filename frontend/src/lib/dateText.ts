// 2026-12-01 (text) <-> a Date at local midnight

export function toDateText(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function fromDateText(text: string): Date | undefined {
  if (!text) return undefined;
  const [year, month, day] = text.split('-').map(Number);
  return new Date(year, month - 1, day);
}
