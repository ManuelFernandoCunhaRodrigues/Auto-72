# Relatorio Financeiro Operacional

Sistema web em Next.js, TypeScript e Tailwind CSS para processar dois arquivos CSV e gerar um ZIP com planilhas Excel por situacao financeira.

## O que o sistema faz

- Recebe o CSV de cobrancas e o CSV de posicoes GPS desatualizadas.
- Normaliza nomes, telefones, status, datas e valores monetarios.
- Cruza posicoes com cobrancas por nome normalizado e reforco por telefone.
- Usa a cobranca mais recente por data de vencimento quando ha multiplos registros.
- Classifica cada correspondencia como:
  - inadimplente 2 meses
  - inadimplente 15 dias
  - em dia
- Conta registros sem correspondencia no resumo.
- Gera `relatorio_financeiro.zip` com:
  - `inadimplentes_2_meses.xlsx`
  - `inadimplentes_15_dias.xlsx`
  - `em_dia.xlsx`
  - `resumo.xlsx`

## Como rodar localmente

```bash
npm install
npm run dev
```

Acesse:

```text
http://localhost:3000
```

## Arquivos esperados

CSV de cobrancas:

- Separador esperado: `;`
- Encoding: UTF-8
- Colunas: `Numero da Cobranca`, `Valor (R$)`, `Status`, `Data de Emissao`, `Forma de cobranca`, `Nome`, `E-mail`, `Telefone`, `Documento`, `Data de Vencimento`, `Valor Pago (R$)`, `Pago Em`

CSV de posicoes desatualizadas:

- Separador esperado: `,`
- Encoding: UTF-8
- Colunas: `Cliente`, `Identificador`, `Nome`, `Operadora`, `Numero`, `Protocolo`, `Serial`, `Data do GPS`, `Cidade`

O backend tambem detecta separador automaticamente e tolera espacos extras, acentos, maiusculas/minusculas, linhas vazias e campos ausentes.

## Endpoint

```text
POST /api/report
```

Campos `multipart/form-data`:

- `cobrancas`: CSV de cobrancas
- `posicoes`: CSV de posicoes desatualizadas

Resposta:

- ZIP: `relatorio_financeiro.zip`
- Header `X-Report-Summary` com o resumo em JSON codificado em base64

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```
