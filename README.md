# Relatorio Financeiro Operacional

Aplicacao web em Next.js, TypeScript e Tailwind CSS para processar dois arquivos CSV, cruzar registros financeiros com posicoes GPS desatualizadas e gerar um ZIP com planilhas Excel.

## Stack

- Next.js 16 com App Router
- React 19
- TypeScript em modo strict
- Tailwind CSS 4
- Route Handler em `POST /api/report`
- PapaParse para CSV
- ExcelJS para `.xlsx`
- JSZip para `.zip`
- Vitest para testes unitarios

## Requisitos

- Node.js `22.17.1` recomendado
- Node.js suportado: `>=22.17.0 <26`
- npm `>=10.9.0`

Use `.nvmrc` quando estiver em ambiente com nvm:

```bash
nvm use
```

## Como rodar

```bash
npm install
npm run dev
```

Acesse:

```text
http://localhost:3000
```

## Como validar

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm audit --omit=dev
```

## Arquivos de entrada

### CSV de cobrancas

- Campo do formulario: `cobrancas`
- Separador esperado: `;`
- Encoding esperado: UTF-8
- Colunas esperadas:
  - `Numero da Cobranca`
  - `Valor (R$)`
  - `Status`
  - `Data de Emissao`
  - `Forma de cobranca`
  - `Nome`
  - `E-mail`
  - `Telefone`
  - `Documento`
  - `Data de Vencimento`
  - `Valor Pago (R$)`
  - `Pago Em`

### CSV de posicoes GPS desatualizadas

- Campo do formulario: `posicoes`
- Separador esperado: `,`
- Encoding esperado: UTF-8
- Colunas esperadas:
  - `Cliente`
  - `Identificador`
  - `Nome`
  - `Operadora`
  - `Numero`
  - `Protocolo`
  - `Serial`
  - `Data do GPS`
  - `Cidade`

O parser detecta separadores entre `;`, `,` e tab quando possivel.

## Regras de processamento

- Nomes sao comparados sem acentos, sem diferenca entre maiusculas/minusculas e com espacos normalizados.
- Telefones sao comparados apenas por digitos, removendo `+55`, espacos, parenteses e tracos.
- Valores monetarios em formato brasileiro, como `69,90` e `R$ 1.234,56`, sao convertidos para numero.
- Datas aceitas: `dd/MM/yyyy` e `dd/MM/yyyy HH:mm:ss`.
- Linhas vazias sao ignoradas.
- Linhas com campos ausentes ou excedentes sao toleradas quando possivel.
- Para multiplas cobrancas do mesmo nome, a cobranca mais recente por `Data de Vencimento` e usada.
- Se nao houver correspondencia entre posicao e cobranca, o item entra apenas no resumo como sem correspondencia.

## Classificacao financeira

- `Pago` ou `Marcado como pago` com `Pago Em` preenchido: `em_dia`
- Sem pagamento e vencimento com atraso de 60 dias ou mais: `inadimplente_2_meses`
- Sem pagamento e vencimento com atraso de 15 a 59 dias: `inadimplente_15_dias`
- Sem pagamento e vencimento com atraso menor que 15 dias: `em_dia`
- Vencimento futuro ou data invalida: `em_dia`
- Sem cobranca correspondente: contado no resumo, sem entrar nas planilhas finais

## Endpoint

```text
POST /api/report
```

Requisicao `multipart/form-data`:

- `cobrancas`: arquivo CSV de cobrancas
- `posicoes`: arquivo CSV de posicoes desatualizadas

Resposta de sucesso:

- `Content-Type: application/zip`
- Download: `relatorio_financeiro.zip`
- Header `X-Report-Summary` com JSON do resumo codificado em base64

Arquivos dentro do ZIP:

- `inadimplentes_2_meses.xlsx`
- `inadimplentes_15_dias.xlsx`
- `em_dia.xlsx`
- `resumo.xlsx`

Resposta de erro:

```json
{
  "error": "Mensagem amigavel do erro"
}
```

## Estrutura principal

```text
app/
  api/report/route.ts
  globals.css
  layout.tsx
  page.tsx
components/
  LoadingState.tsx
  ResultCard.tsx
  StatusAlert.tsx
  UploadCard.tsx
lib/
  classify.ts
  export-xlsx.ts
  export-zip.ts
  match-records.ts
  normalize.ts
  parse-csv.ts
  utils.ts
  validations.ts
tests/
  report-processing.test.ts
types/
  financial.ts
```

## Limitacoes conhecidas

- O sistema assume CSV em UTF-8.
- Correspondencia parcial/fuzzy por nome ainda nao e aplicada; o matching principal usa nome normalizado exato e telefone como reforco.
- Registros sem correspondencia nao entram nas planilhas finais, apenas no `resumo.xlsx` e no resumo retornado pelo header.
