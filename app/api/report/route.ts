import { NextResponse } from "next/server";

import { createReportWorkbooks } from "@/lib/export-xlsx";
import { createZipFile } from "@/lib/export-zip";
import { processFinancialReport } from "@/lib/match-records";
import { parseCobrancasCsv, parsePosicoesCsv } from "@/lib/parse-csv";
import { getReportFiles, readFileAsUtf8 } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const { cobrancasFile, posicoesFile } = getReportFiles(formData);

    const [cobrancasText, posicoesText] = await Promise.all([
      readFileAsUtf8(cobrancasFile),
      readFileAsUtf8(posicoesFile),
    ]);

    const cobrancas = parseCobrancasCsv(cobrancasText);
    const posicoes = parsePosicoesCsv(posicoesText);
    const report = processFinancialReport(cobrancas.rows, posicoes.rows);
    const workbooks = await createReportWorkbooks(report);
    const zip = await createZipFile(workbooks);
    const summary = Buffer.from(JSON.stringify(report.resumo)).toString("base64");

    return new NextResponse(new Uint8Array(zip), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="relatorio_financeiro.zip"',
        "X-Report-Summary": summary,
        "X-Cobrancas-Delimiter": cobrancas.delimiter,
        "X-Posicoes-Delimiter": posicoes.delimiter,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Nao foi possivel gerar o relatorio.";

    return NextResponse.json(
      {
        error: message,
      },
      {
        status: 400,
      },
    );
  }
}
