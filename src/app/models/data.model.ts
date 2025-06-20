export interface Disciplina {
  _id: string;
  codigo: string;
  nome: string;
  cargaHoraria: number;
  creditos: number;
  departamento: string;
  periodo: number;
  prerequisitos: Disciplina[];
  ativa: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface User {
  _id?: string; // Opcional porque não existe ao criar um novo usuário no frontend, mas vem do backend
  nome: string;
  email: string;
  senha?: string; // Usado apenas para criar ou atualizar senha, não é armazenado em plain text
  tipo: 'professor' | 'admin' | string; // 'string' como fallback se houver outros tipos
  departamento?: string; // Opcional
  telefone?: string;    // Opcional
  ativo: boolean;
  criadoEm?: Date;      // Geralmente definido pelo backend
  atualizadoEm?: Date;  // Geralmente definido pelo backend
}

export interface Sala {
  _id: string;
  codigo: string;
  nome: string;
  capacidade: number;
  //tipo: string; // Se estiver assim, 'tipo' nunca será null ou undefined
  tipo: 'laboratorio' | 'sala_aula' | 'auditorio' | 'sala_multimidia' | string;
  bloco: string;
  andar: number;
  recursos: string[];
  disponivel: boolean;
  observacoes?: string;
  criadoEm: Date;
  atualizadoEm: Date;
  
}

export interface ProfessorPreferencia {
  _id: string;
  professor: string;
  disciplinas: {
    disciplina: Disciplina;
    preferencia: number;
  }[];
  disponibilidadeHorarios: {
    diaSemana: 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado';
    turno: 'manha' | 'tarde' | 'noite';
    horarios: {
      inicio: string;
      fim: string;
    }[];
    disponivel: boolean;
  }[];
  restricoes: {
    tipo: 'nao_consecutivo' | 'intervalo_minimo' | 'sala_preferida' | 'turno_preferido';
    descricao: string;
    valor?: any;
    prioridade: number;
  }[];
  cargaHorariaMaxima: number;
  observacoes?: string;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface HorarioGerado {
  _id: string;
  titulo: string;
  professor: string;
  semestre: string;
  parametrosAlgoritmo: {
    populacao: number;
    geracoes: number;
    taxaMutacao: number;
    tipoCruzamento: number;
  };
  horarios: {
    disciplina: Disciplina;
    sala: Sala;
    diaSemana: string;
    horarioInicio: string;
    horarioFim: string;
    turno: string;
  }[];
  restricoesVioladas: {
    tipo: string;
    descricao: string;
    severidade: 'baixa' | 'media' | 'alta';
  }[];
  fitnessScore?: number;
  status: 'gerando' | 'concluido' | 'erro' | 'cancelado';
  tempoExecucao?: number;
  observacoes?: string;
  criadoEm: Date;
  atualizadoEm: Date;
}

