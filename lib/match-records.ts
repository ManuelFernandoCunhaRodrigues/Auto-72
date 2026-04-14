import type {
  Cobranca,
  PosicaoDesatualizada,
  RegistroFinal,
  RelatorioProcessado,
} from "@/types/financial";

import { classifyFinancialStatus } from "./classify";
import { cleanText, normalizeName, normalizePhone } from "./normalize";
import { compareBrazilianDatesDesc } from "./utils";

type CobrancaIndex = {
  byName: Map<string, Cobranca[]>;
  byPhone: Map<string, Cobranca[]>;
};

function sortCobrancasByRecentDueDate(cobrancas: Cobranca[]): Cobranca[] {
  return [...cobrancas].sort((left, right) =>
    compareBrazilianDatesDesc(left.dataVencimento, right.dataVencimento),
  );
}

function phonesCompatible(left?: string, right?: string): boolean {
  const normalizedLeft = normalizePhone(left);
  const normalizedRight = normalizePhone(right);

  if (!normalizedLeft || !normalizedRight) {
    return false;
  }

  if (normalizedLeft === normalizedRight) {
    return true;
  }

  return (
    normalizedLeft.length >= 8 &&
    normalizedRight.length >= 8 &&
    normalizedLeft.slice(-8) === normalizedRight.slice(-8)
  );
}

function addToIndex(
  index: Map<string, Cobranca[]>,
  key: string,
  cobranca: Cobranca,
): void {
  if (!key) {
    return;
  }

  const existing = index.get(key) ?? [];
  existing.push(cobranca);
  index.set(key, existing);
}

function buildCobrancaIndex(cobrancas: Cobranca[]): CobrancaIndex {
  const byName = new Map<string, Cobranca[]>();
  const byPhone = new Map<string, Cobranca[]>();

  cobrancas.forEach((cobranca) => {
    addToIndex(byName, normalizeName(cobranca.nome), cobranca);
    addToIndex(byPhone, normalizePhone(cobranca.telefone), cobranca);
  });

  for (const [key, value] of byName.entries()) {
    byName.set(key, sortCobrancasByRecentDueDate(value));
  }

  for (const [key, value] of byPhone.entries()) {
    byPhone.set(key, sortCobrancasByRecentDueDate(value));
  }

  return { byName, byPhone };
}

function getCandidateNames(posicao: PosicaoDesatualizada): string[] {
  return Array.from(
    new Set([posicao.nome, posicao.cliente].map(normalizeName).filter(Boolean)),
  );
}

function findMatchingCobranca(
  posicao: PosicaoDesatualizada,
  index: CobrancaIndex,
): Cobranca | undefined {
  const normalizedPhone = normalizePhone(posicao.numero);

  for (const normalizedName of getCandidateNames(posicao)) {
    const sameNameMatches = index.byName.get(normalizedName);

    if (sameNameMatches?.length) {
      const phoneReinforcedMatch = sameNameMatches.find((cobranca) =>
        phonesCompatible(posicao.numero, cobranca.telefone),
      );

      return phoneReinforcedMatch ?? sameNameMatches[0];
    }
  }

  if (normalizedPhone) {
    return index.byPhone.get(normalizedPhone)?.[0];
  }

  return undefined;
}

function toRegistroFinal(
  posicao: PosicaoDesatualizada,
  cobranca: Cobranca,
  today: Date,
): RegistroFinal {
  const classificacao = classifyFinancialStatus(cobranca, today);

  return {
    origem: "posicoes_desatualizadas",
    nome: cleanText(cobranca.nome || posicao.nome || posicao.cliente),
    telefone: cleanText(cobranca.telefone || posicao.numero),
    documento: cleanText(cobranca.documento),
    identificador: cleanText(posicao.identificador),
    serial: cleanText(posicao.serial),
    cidade: cleanText(posicao.cidade),
    dataGps: cleanText(posicao.dataGps),
    statusFinanceiroOriginal: cleanText(cobranca.status),
    dataVencimento: cleanText(cobranca.dataVencimento),
    pagoEm: cleanText(cobranca.pagoEm),
    valor: cobranca.valor,
    diasAtraso: classificacao.diasAtraso,
    categoria: classificacao.categoria,
    correspondenciaEncontrada: true,
  };
}

export function processFinancialReport(
  cobrancas: Cobranca[],
  posicoes: PosicaoDesatualizada[],
  today = new Date(),
): RelatorioProcessado {
  const index = buildCobrancaIndex(cobrancas);
  const registros: RegistroFinal[] = [];
  let totalSemCorrespondencia = 0;

  for (const posicao of posicoes) {
    const match = findMatchingCobranca(posicao, index);

    if (!match) {
      totalSemCorrespondencia += 1;
      continue;
    }

    registros.push(toRegistroFinal(posicao, match, today));
  }

  return {
    registros,
    resumo: {
      totalPosicoesProcessadas: posicoes.length,
      totalInadimplente2Meses: registros.filter(
        (registro) => registro.categoria === "inadimplente_2_meses",
      ).length,
      totalInadimplente15Dias: registros.filter(
        (registro) => registro.categoria === "inadimplente_15_dias",
      ).length,
      totalEmDia: registros.filter((registro) => registro.categoria === "em_dia")
        .length,
      totalSemCorrespondencia,
    },
  };
}
