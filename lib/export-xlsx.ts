import ExcelJS from "exceljs";
import type {
  CategoriaFinal,
  RegistroFinal,
  RelatorioProcessado,
  ResumoRelatorio,
} from "@/types/financial";

const CATEGORY_FILENAMES: Record<CategoriaFinal, string> = {
  inadimplente_2_meses: "inadimplentes_2_meses.xlsx",
  inadimplente_15_dias: "inadimplentes_15_dias.xlsx",
  em_dia: "em_dia.xlsx",
};

const CATEGORY_TITLES: Record<CategoriaFinal, string> = {
  inadimplente_2_meses: "Inadimplentes 2 meses",
  inadimplente_15_dias: "Inadimplentes 15 dias",
  em_dia: "Em dia",
};

const REPORT_COLUMNS = [
  "Nome",
  "Telefone",
  "Documento",
  "Identificador",
  "Serial",
  "Cidade",
  "Data do GPS",
  "Status Financeiro",
  "Data de Vencimento",
  "Pago Em",
  "Valor",
  "Dias de Atraso",
  "Correspondencia Encontrada",
] as const;

function toFriendlyCategory(categoria: CategoriaFinal): string {
  return CATEGORY_TITLES[categoria];
}

function toWorksheetRows(registros: RegistroFinal[]): Record<string, unknown>[] {
  return registros.map((registro) => ({
    Nome: registro.nome,
    Telefone: registro.telefone ?? "",
    Documento: registro.documento ?? "",
    Identificador: registro.identificador ?? "",
    Serial: registro.serial ?? "",
    Cidade: registro.cidade ?? "",
    "Data do GPS": registro.dataGps ?? "",
    "Status Financeiro": registro.statusFinanceiroOriginal ?? "",
    "Data de Vencimento": registro.dataVencimento ?? "",
    "Pago Em": registro.pagoEm ?? "",
    Valor: registro.valor ?? 0,
    "Dias de Atraso": registro.diasAtraso,
    "Correspondencia Encontrada": registro.correspondenciaEncontrada ? "Sim" : "Nao",
  }));
}

function autoFitColumns(
  worksheet: ExcelJS.Worksheet,
  rows: Record<string, unknown>[],
) {
  worksheet.columns.forEach((column) => {
    const header = String(column.header ?? "");
    const maxLength = Math.max(
      header.length,
      ...rows.map((row) => String(row[header] ?? "").length),
    );
    column.width = Math.min(48, maxLength + 2);
  });
}

function styleWorksheet(worksheet: ExcelJS.Worksheet) {
  worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1F2937" },
  };
  worksheet.views = [{ state: "frozen", ySplit: 1 }];
}

async function workbookToBuffer(workbook: ExcelJS.Workbook): Promise<Buffer> {
  const content = await workbook.xlsx.writeBuffer();
  return Buffer.from(content);
}

export async function createCategoryWorkbook(
  registros: RegistroFinal[],
  categoria: CategoriaFinal,
): Promise<Buffer> {
  const rows = toWorksheetRows(registros);
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(toFriendlyCategory(categoria));

  worksheet.columns = REPORT_COLUMNS.map((header) => ({
    header,
    key: header,
  }));
  worksheet.addRows(rows);
  styleWorksheet(worksheet);
  autoFitColumns(worksheet, rows);

  return workbookToBuffer(workbook);
}

function summaryRows(resumo: ResumoRelatorio): Record<string, unknown>[] {
  return [
    {
      Indicador: "Total de posicoes desatualizadas processadas",
      Total: resumo.totalPosicoesProcessadas,
    },
    {
      Indicador: "Total inadimplente 2 meses",
      Total: resumo.totalInadimplente2Meses,
    },
    {
      Indicador: "Total inadimplente 15 dias",
      Total: resumo.totalInadimplente15Dias,
    },
    {
      Indicador: "Total em dia",
      Total: resumo.totalEmDia,
    },
    {
      Indicador: "Total sem correspondencia no arquivo de cobranca",
      Total: resumo.totalSemCorrespondencia,
    },
  ];
}

export async function createSummaryWorkbook(
  resumo: ResumoRelatorio,
): Promise<Buffer> {
  const rows = summaryRows(resumo);
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Resumo");

  worksheet.columns = Object.keys(rows[0]).map((header) => ({
    header,
    key: header,
  }));
  worksheet.addRows(rows);
  styleWorksheet(worksheet);
  autoFitColumns(worksheet, rows);

  return workbookToBuffer(workbook);
}

export async function createReportWorkbooks(
  report: RelatorioProcessado,
): Promise<Record<string, Buffer>> {
  const files: Record<string, Buffer> = {};

  for (const categoria of Object.keys(CATEGORY_FILENAMES) as CategoriaFinal[]) {
    files[CATEGORY_FILENAMES[categoria]] = await createCategoryWorkbook(
      report.registros.filter((registro) => registro.categoria === categoria),
      categoria,
    );
  }

  files["resumo.xlsx"] = await createSummaryWorkbook(report.resumo);

  return files;
}
