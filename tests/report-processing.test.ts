import { describe, expect, it } from "vitest";

import { classifyFinancialStatus } from "@/lib/classify";
import { processFinancialReport } from "@/lib/match-records";
import { normalizeName, normalizePhone } from "@/lib/normalize";
import { parseCobrancasCsv, parsePosicoesCsv } from "@/lib/parse-csv";
import { parseBrazilianDate, parseMoney } from "@/lib/utils";
import type { Cobranca, PosicaoDesatualizada } from "@/types/financial";

const TODAY = new Date(2026, 3, 13);

function makeCobranca(overrides: Partial<Cobranca>): Cobranca {
  return {
    valor: 69.9,
    status: "Aberto",
    nome: "Maria Silva",
    dataVencimento: "01/04/2026",
    telefone: "85999998888",
    ...overrides,
  };
}

function makePosicao(
  overrides: Partial<PosicaoDesatualizada> = {},
): PosicaoDesatualizada {
  return {
    cliente: "Maria Silva",
    identificador: "EQ-001",
    nome: "Rastreador 001",
    numero: "+55 (85) 99999-8888",
    serial: "SERIAL-001",
    cidade: "Fortaleza",
    dataGps: "01/04/2026",
    ...overrides,
  };
}

describe("normalizacao", () => {
  it("normaliza nomes removendo acentos, caixa e espacos extras", () => {
    expect(normalizeName("  MARIA   da Conceicao Ávila  ")).toBe(
      "maria da conceicao avila",
    );
  });

  it("normaliza telefones removendo codigo do Brasil e pontuacao", () => {
    expect(normalizePhone("+55 (85) 9 9999-8888")).toBe("85999998888");
    expect(normalizePhone("55 85 99999-8888")).toBe("85999998888");
  });
});

describe("parsing utilitario", () => {
  it("interpreta valores monetarios brasileiros", () => {
    expect(parseMoney("R$ 1.234,56")).toBe(1234.56);
    expect(parseMoney("69,90")).toBe(69.9);
    expect(parseMoney("")).toBe(0);
  });

  it("interpreta datas brasileiras e tolera datas invalidas", () => {
    const parsed = parseBrazilianDate("13/04/2026 10:30:15");

    expect(parsed?.getFullYear()).toBe(2026);
    expect(parsed?.getMonth()).toBe(3);
    expect(parsed?.getDate()).toBe(13);
    expect(parseBrazilianDate("99/99/2026")).toBeUndefined();
  });
});

describe("classificacao financeira", () => {
  it("classifica cobranca paga como em dia", () => {
    expect(
      classifyFinancialStatus(
        makeCobranca({
          status: "Marcado como pago",
          pagoEm: "11/03/2026",
          dataVencimento: "01/01/2026",
        }),
        TODAY,
      ).categoria,
    ).toBe("em_dia");
  });

  it("classifica atraso de 60 dias ou mais como inadimplente 2 meses", () => {
    const result = classifyFinancialStatus(
      makeCobranca({ dataVencimento: "01/02/2026", pagoEm: "" }),
      TODAY,
    );

    expect(result.categoria).toBe("inadimplente_2_meses");
    expect(result.diasAtraso).toBeGreaterThanOrEqual(60);
  });

  it("classifica atraso entre 15 e 59 dias como inadimplente 15 dias", () => {
    const result = classifyFinancialStatus(
      makeCobranca({ dataVencimento: "25/03/2026", pagoEm: "" }),
      TODAY,
    );

    expect(result.categoria).toBe("inadimplente_15_dias");
    expect(result.diasAtraso).toBeGreaterThanOrEqual(15);
    expect(result.diasAtraso).toBeLessThan(60);
  });

  it("classifica vencimento futuro ou dados faltantes como em dia", () => {
    expect(
      classifyFinancialStatus(
        makeCobranca({ dataVencimento: "20/04/2026", pagoEm: "" }),
        TODAY,
      ).categoria,
    ).toBe("em_dia");
    expect(classifyFinancialStatus(undefined, TODAY).categoria).toBe("em_dia");
  });
});

describe("cruzamento de registros", () => {
  it("usa a cobranca mais recente quando ha multiplas cobrancas para o nome", () => {
    const report = processFinancialReport(
      [
        makeCobranca({ dataVencimento: "01/02/2026", status: "Aberto" }),
        makeCobranca({ dataVencimento: "10/04/2026", status: "Aberto" }),
      ],
      [makePosicao()],
      TODAY,
    );

    expect(report.registros).toHaveLength(1);
    expect(report.registros[0].categoria).toBe("em_dia");
    expect(report.registros[0].dataVencimento).toBe("10/04/2026");
  });

  it("usa telefone como reforco e contabiliza registros sem correspondencia", () => {
    const report = processFinancialReport(
      [makeCobranca({ nome: "Cliente Certo", telefone: "85999998888" })],
      [
        makePosicao({ cliente: "Cliente Certo", nome: "Equipamento A" }),
        makePosicao({
          cliente: "Cliente Ausente",
          nome: "Equipamento B",
          numero: "85911112222",
        }),
      ],
      TODAY,
    );

    expect(report.resumo.totalPosicoesProcessadas).toBe(2);
    expect(report.registros).toHaveLength(1);
    expect(report.resumo.totalSemCorrespondencia).toBe(1);
  });
});

describe("parser de CSV", () => {
  it("parseia cobrancas com separador detectado, espacos e linha malformada", () => {
    const csv = [
      "Numero da Cobranca;Valor (R$);Status;Nome;Telefone;Data de Vencimento;Pago Em",
      "1; 69,90 ; Aberto ; Maria Silva ; +55 (85) 99999-8888 ; 01/02/2026 ;",
      "",
      "linha-malformada",
    ].join("\n");

    const parsed = parseCobrancasCsv(csv);

    expect(parsed.delimiter).toBe(";");
    expect(parsed.rows[0].valor).toBe(69.9);
    expect(parsed.rows[0].nome).toBe("Maria Silva");
    expect(parsed.rows.length).toBeGreaterThanOrEqual(1);
  });

  it("prioriza a coluna Nome no CSV de posicoes quando Cliente tambem existe", () => {
    const csv = [
      "Cliente,Identificador,Nome,Operadora,Numero,Protocolo,Serial,Data do GPS,Cidade",
      "Cliente Financeiro,EQ-001,Equipamento GPS,Vivo,85999998888,P1,S1,01/04/2026,Fortaleza",
    ].join("\n");

    const parsed = parsePosicoesCsv(csv);

    expect(parsed.delimiter).toBe(",");
    expect(parsed.rows[0].cliente).toBe("Cliente Financeiro");
    expect(parsed.rows[0].nome).toBe("Equipamento GPS");
  });
});
