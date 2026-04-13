const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

export type ReportFiles = {
  cobrancasFile: File;
  posicoesFile: File;
};

function isFileLike(value: FormDataEntryValue | null): value is File {
  return Boolean(value && typeof value === "object" && "arrayBuffer" in value);
}

function validateCsvFile(file: File, label: string): void {
  if (!file.name.toLowerCase().endsWith(".csv")) {
    throw new Error(`${label} precisa ser um arquivo CSV.`);
  }

  if (file.size <= 0) {
    throw new Error(`${label} esta vazio.`);
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`${label} ultrapassa o limite de 20 MB.`);
  }
}

export function getReportFiles(formData: FormData): ReportFiles {
  const cobrancasFile = formData.get("cobrancas");
  const posicoesFile = formData.get("posicoes");

  if (!isFileLike(cobrancasFile)) {
    throw new Error("Envie o CSV de cobrancas.");
  }

  if (!isFileLike(posicoesFile)) {
    throw new Error("Envie o CSV de posicoes desatualizadas.");
  }

  validateCsvFile(cobrancasFile, "CSV de cobrancas");
  validateCsvFile(posicoesFile, "CSV de posicoes desatualizadas");

  return {
    cobrancasFile,
    posicoesFile,
  };
}

export async function readFileAsUtf8(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  return buffer.toString("utf8");
}
