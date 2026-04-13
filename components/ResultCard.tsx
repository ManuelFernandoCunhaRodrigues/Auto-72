import type { ResumoRelatorio } from "@/types/financial";

type ResultCardProps = {
  summary: ResumoRelatorio;
};

const summaryItems = [
  {
    label: "Posicoes processadas",
    key: "totalPosicoesProcessadas",
  },
  {
    label: "Inadimplente 2 meses",
    key: "totalInadimplente2Meses",
  },
  {
    label: "Inadimplente 15 dias",
    key: "totalInadimplente15Dias",
  },
  {
    label: "Em dia",
    key: "totalEmDia",
  },
  {
    label: "Sem correspondencia",
    key: "totalSemCorrespondencia",
  },
] as const;

export function ResultCard({ summary }: ResultCardProps) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-950">Resumo gerado</h2>
          <p className="mt-1 text-sm text-zinc-600">
            O ZIP foi preparado com as planilhas financeiras separadas por grupo.
          </p>
        </div>
      </div>

      <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {summaryItems.map((item) => (
          <div
            key={item.key}
            className="rounded-lg border border-zinc-200 bg-zinc-50 p-4"
          >
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              {item.label}
            </dt>
            <dd className="mt-2 text-2xl font-semibold text-zinc-950">
              {summary[item.key]}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
