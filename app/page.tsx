"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { LoadingState } from "@/components/LoadingState";
import { ResultCard } from "@/components/ResultCard";
import { StatusAlert } from "@/components/StatusAlert";
import { UploadCard } from "@/components/UploadCard";
import type { ResumoRelatorio } from "@/types/financial";

function parseSummaryHeader(header: string | null): ResumoRelatorio | null {
  if (!header) {
    return null;
  }

  try {
    return JSON.parse(window.atob(header)) as ResumoRelatorio;
  } catch {
    return null;
  }
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export default function Home() {
  const [cobrancasFile, setCobrancasFile] = useState<File | null>(null);
  const [posicoesFile, setPosicoesFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [summary, setSummary] = useState<ResumoRelatorio | null>(null);

  const canSubmit = useMemo(
    () => Boolean(cobrancasFile && posicoesFile && !isLoading),
    [cobrancasFile, isLoading, posicoesFile],
  );

  async function handleSubmit() {
    setError("");
    setSuccess("");
    setSummary(null);

    if (!cobrancasFile || !posicoesFile) {
      setError("Selecione os dois arquivos CSV antes de gerar o relatorio.");
      return;
    }

    const formData = new FormData();
    formData.append("cobrancas", cobrancasFile);
    formData.append("posicoes", posicoesFile);

    setIsLoading(true);

    try {
      const response = await fetch("/api/report", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error || "Nao foi possivel gerar o relatorio.");
      }

      const zipBlob = await response.blob();
      const reportSummary = parseSummaryHeader(response.headers.get("X-Report-Summary"));

      if (reportSummary) {
        setSummary(reportSummary);
      }

      downloadBlob(zipBlob, "relatorio_financeiro.zip");
      setSuccess("Relatorio gerado com sucesso. O download do ZIP foi iniciado.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Nao foi possivel gerar o relatorio.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f7f9] text-zinc-950">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
          <Image
            src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1600&q=80"
            alt="Mesa de trabalho com relatorios financeiros"
            width={1600}
            height={360}
            priority
            className="h-36 w-full object-cover"
          />
          <div className="p-6 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Operacao financeira
            </p>
            <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-normal text-zinc-950 sm:text-4xl">
              Relatorio de cobrancas e posicoes GPS desatualizadas
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-600">
              Envie os CSVs de cobrancas e posicoes desatualizadas para cruzar
              clientes, classificar atrasos e baixar as planilhas finais em ZIP.
            </p>
          </div>
        </div>

        <section className="grid gap-4 lg:grid-cols-2">
          <UploadCard
            id="cobrancas"
            title="CSV de Cobrancas"
            description="Arquivo separado por ponto e virgula, com status, vencimento, valor e dados do cliente."
            file={cobrancasFile}
            onFileChange={setCobrancasFile}
          />
          <UploadCard
            id="posicoes"
            title="CSV de Posicoes Desatualizadas"
            description="Arquivo separado por virgula, com cliente, numero, serial, cidade e data do GPS."
            file={posicoesFile}
            onFileChange={setPosicoesFile}
          />
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="min-h-12 rounded-lg bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-600"
          >
            Gerar Relatorio
          </button>
          <p className="text-sm text-zinc-600">
            Saida: inadimplentes_2_meses.xlsx, inadimplentes_15_dias.xlsx,
            em_dia.xlsx e resumo.xlsx.
          </p>
        </div>

        {isLoading ? <LoadingState /> : null}
        {error ? <StatusAlert type="error" message={error} /> : null}
        {success ? <StatusAlert type="success" message={success} /> : null}
        {summary ? <ResultCard summary={summary} /> : null}
      </section>
    </main>
  );
}
