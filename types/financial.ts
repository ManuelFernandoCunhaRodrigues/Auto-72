export type CategoriaFinal =
  | "inadimplente_2_meses"
  | "inadimplente_15_dias"
  | "em_dia";

export type CategoriaInterna = CategoriaFinal | "sem_correspondencia";

export type Cobranca = {
  numeroCobranca?: string;
  valor: number;
  status: string;
  dataEmissao?: string;
  formaCobranca?: string;
  nome: string;
  email?: string;
  telefone?: string;
  documento?: string;
  dataVencimento?: string;
  valorPago?: number;
  pagoEm?: string;
};

export type PosicaoDesatualizada = {
  cliente?: string;
  identificador?: string;
  nome: string;
  operadora?: string;
  numero?: string;
  protocolo?: string;
  serial?: string;
  dataGps?: string;
  cidade?: string;
};

export type RegistroFinal = {
  origem: "posicoes_desatualizadas";
  nome: string;
  telefone?: string;
  documento?: string;
  identificador?: string;
  serial?: string;
  cidade?: string;
  dataGps?: string;
  statusFinanceiroOriginal?: string;
  dataVencimento?: string;
  pagoEm?: string;
  valor?: number;
  diasAtraso: number;
  categoria: CategoriaFinal;
  correspondenciaEncontrada: boolean;
};

export type ResumoRelatorio = {
  totalPosicoesProcessadas: number;
  totalInadimplente2Meses: number;
  totalInadimplente15Dias: number;
  totalEmDia: number;
  totalSemCorrespondencia: number;
};

export type RelatorioProcessado = {
  registros: RegistroFinal[];
  resumo: ResumoRelatorio;
};

export type ClassificacaoFinanceira = {
  categoria: CategoriaFinal;
  diasAtraso: number;
};

export type CsvParseResult<T> = {
  rows: T[];
  delimiter: string;
  totalRows: number;
};
