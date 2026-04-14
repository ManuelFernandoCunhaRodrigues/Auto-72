import "./globals.css";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Relatorio Financeiro Operacional",
  description: "Processamento de cobrancas e posicoes GPS desatualizadas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
