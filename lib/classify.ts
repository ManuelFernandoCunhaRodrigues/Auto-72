import type { ClassificacaoFinanceira, Cobranca } from "@/types/financial";

import { cleanText, normalizeStatus } from "./normalize";
import { daysLateFromDueDate } from "./utils";

const PAID_STATUSES = new Set(["pago", "marcado como pago"]);

export function classifyFinancialStatus(
  cobranca: Cobranca | undefined,
  today = new Date(),
): ClassificacaoFinanceira {
  if (!cobranca) {
    return {
      categoria: "em_dia",
      diasAtraso: 0,
    };
  }

  const normalizedStatus = normalizeStatus(cobranca.status);
  const hasPaymentDate = Boolean(cleanText(cobranca.pagoEm));

  if (PAID_STATUSES.has(normalizedStatus) && hasPaymentDate) {
    return {
      categoria: "em_dia",
      diasAtraso: 0,
    };
  }

  const diasAtraso = daysLateFromDueDate(cobranca.dataVencimento, today);

  if (diasAtraso >= 60) {
    return {
      categoria: "inadimplente_2_meses",
      diasAtraso,
    };
  }

  if (diasAtraso >= 15) {
    return {
      categoria: "inadimplente_15_dias",
      diasAtraso,
    };
  }

  return {
    categoria: "em_dia",
    diasAtraso,
  };
}
