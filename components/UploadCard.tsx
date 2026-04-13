"use client";

type UploadCardProps = {
  id: string;
  title: string;
  description: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
};

export function UploadCard({
  id,
  title,
  description,
  file,
  onFileChange,
}: UploadCardProps) {
  return (
    <label
      htmlFor={id}
      className="flex min-h-44 cursor-pointer flex-col justify-between rounded-lg border border-dashed border-zinc-300 bg-white p-5 shadow-sm transition hover:border-emerald-500 hover:bg-emerald-50/40"
    >
      <span>
        <span className="block text-base font-semibold text-zinc-950">{title}</span>
        <span className="mt-2 block text-sm leading-6 text-zinc-600">
          {description}
        </span>
      </span>

      <span className="mt-5 flex min-h-11 items-center justify-between gap-3 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
        <span className="min-w-0 flex-1 truncate">
          {file ? file.name : "Selecionar arquivo CSV"}
        </span>
        <span className="shrink-0 rounded-md bg-zinc-950 px-3 py-2 text-xs font-semibold text-white">
          Buscar
        </span>
      </span>

      <input
        id={id}
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
      />
    </label>
  );
}
