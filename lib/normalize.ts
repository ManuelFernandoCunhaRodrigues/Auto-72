export function stripBom(value: string): string {
  return value.replace(/^\uFEFF/, "");
}

export function cleanText(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return stripBom(String(value)).trim();
}

export function removeAccents(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function normalizeName(value: unknown): string {
  return removeAccents(cleanText(value))
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeStatus(value: unknown): string {
  return removeAccents(cleanText(value))
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizePhone(value: unknown): string {
  let digits = cleanText(value).replace(/\D/g, "");

  if (digits.startsWith("55") && digits.length > 11) {
    digits = digits.slice(2);
  }

  if (digits.length > 11) {
    digits = digits.slice(-11);
  }

  return digits;
}

export function normalizeDocument(value: unknown): string {
  return cleanText(value).replace(/\D/g, "");
}

export function normalizeHeader(value: unknown): string {
  return removeAccents(cleanText(value))
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getField(
  row: Record<string, unknown>,
  labels: string[],
): string {
  const normalizedLabels = new Set(labels.map(normalizeHeader));
  const entry = Object.entries(row).find(([key]) =>
    normalizedLabels.has(normalizeHeader(key)),
  );

  return cleanText(entry?.[1]);
}
