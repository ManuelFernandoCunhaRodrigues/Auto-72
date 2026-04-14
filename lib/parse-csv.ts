import Papa from "papaparse";

import type { Cobranca, CsvParseResult, PosicaoDesatualizada } from "@/types/financial";

import { cleanText, getField, stripBom } from "./normalize";
import { parseMoney } from "./utils";

type RawRow = Record<string, unknown>;

const DELIMITER_CANDIDATES = [";", ",", "\t"];

function isEmptyRow(row: RawRow): boolean {
  return Object.values(row).every((value) => !cleanText(value));
}

export function detectDelimiter(csvText: string): string {
  const sampleLines = stripBom(csvText)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 20);

  const scores = DELIMITER_CANDIDATES.map((delimiter) => ({
    delimiter,
    score: sampleLines.reduce(
      (total, line) => total + line.split(delimiter).length - 1,
      0,
    ),
  }));

  scores.sort((left, right) => right.score - left.score);
  return scores[0]?.score ? scores[0].delimiter : ",";
}

function parseRows(csvText: string, delimiter?: string): CsvParseResult<RawRow> {
  const resolvedDelimiter = delimiter ?? detectDelimiter(csvText);
  const parsed = Papa.parse<RawRow>(stripBom(csvText), {
    delimiter: resolvedDelimiter,
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => cleanText(header),
    transform: (value) => cleanText(value),
  });

  if (parsed.errors.some((error) => error.type !== "FieldMismatch")) {
    const firstError = parsed.errors.find((error) => error.type !== "FieldMismatch");
    throw new Error(firstError?.message || "Nao foi possivel ler o CSV.");
  }

  const rows = parsed.data.filter((row) => row && !isEmptyRow(row));

  return {
    rows,
    delimiter: resolvedDelimiter,
    totalRows: rows.length,
  };
}

export function parseCobrancasCsv(csvText: string): CsvParseResult<Cobranca> {
  const parsed = parseRows(csvText, detectDelimiter(csvText));
  const rows = parsed.rows
    .map((row) => ({
      numeroCobranca: getField(row, ["Numero da Cobranca", "Número da Cobrança"]),
      valor: parseMoney(getField(row, ["Valor (R$)", "Valor"])),
      status: getField(row, ["Status"]),
      dataEmissao: getField(row, ["Data de Emissao", "Data de Emissão"]),
      formaCobranca: getField(row, ["Forma de cobranca", "Forma de cobrança"]),
      nome: getField(row, ["Nome"]),
      email: getField(row, ["E-mail", "Email"]),
      telefone: getField(row, ["Telefone"]),
      documento: getField(row, ["Documento"]),
      dataVencimento: getField(row, ["Data de Vencimento"]),
      valorPago: parseMoney(getField(row, ["Valor Pago (R$)", "Valor Pago"])),
      pagoEm: getField(row, ["Pago Em"]),
    }))
    .filter((row) => row.nome || row.telefone || row.documento);

  return {
    ...parsed,
    rows,
    totalRows: rows.length,
  };
}

export function parsePosicoesCsv(
  csvText: string,
): CsvParseResult<PosicaoDesatualizada> {
  const parsed = parseRows(csvText, detectDelimiter(csvText));
  const rows = parsed.rows
    .map((row) => ({
      cliente: getField(row, ["Cliente"]),
      identificador: getField(row, ["Identificador"]),
      nome: getField(row, ["Nome", "Cliente"]),
      operadora: getField(row, ["Operadora"]),
      numero: getField(row, ["Numero", "Número"]),
      protocolo: getField(row, ["Protocolo"]),
      serial: getField(row, ["Serial"]),
      dataGps: getField(row, ["Data do GPS", "Data GPS"]),
      cidade: getField(row, ["Cidade"]),
    }))
    .filter((row) => row.nome || row.numero || row.identificador || row.serial);

  return {
    ...parsed,
    rows,
    totalRows: rows.length,
  };
}
