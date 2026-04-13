import { cleanText } from "./normalize";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function parseMoney(value: unknown): number {
  const raw = cleanText(value);

  if (!raw) {
    return 0;
  }

  const normalized = raw
    .replace(/[R$\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^0-9.-]/g, "");

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parseBrazilianDate(value: unknown): Date | undefined {
  const raw = cleanText(value);

  if (!raw) {
    return undefined;
  }

  const match = raw.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/,
  );

  if (match) {
    const [, day, month, year, hour = "0", minute = "0", second = "0"] =
      match;
    const parsed = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
    );

    if (
      parsed.getFullYear() === Number(year) &&
      parsed.getMonth() === Number(month) - 1 &&
      parsed.getDate() === Number(day)
    ) {
      return parsed;
    }
  }

  const fallback = new Date(raw);
  return Number.isNaN(fallback.getTime()) ? undefined : fallback;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function daysLateFromDueDate(
  dueDate: string | undefined,
  today = new Date(),
): number {
  const parsedDueDate = parseBrazilianDate(dueDate);

  if (!parsedDueDate) {
    return 0;
  }

  const diff = startOfDay(today).getTime() - startOfDay(parsedDueDate).getTime();
  return Math.max(0, Math.floor(diff / MS_PER_DAY));
}

export function compareBrazilianDatesDesc(
  left?: string,
  right?: string,
): number {
  const leftTime = parseBrazilianDate(left)?.getTime() ?? 0;
  const rightTime = parseBrazilianDate(right)?.getTime() ?? 0;

  return rightTime - leftTime;
}

export function formatSummaryFilename(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w.-]+/g, "_")
    .replace(/_+/g, "_")
    .toLowerCase();
}
