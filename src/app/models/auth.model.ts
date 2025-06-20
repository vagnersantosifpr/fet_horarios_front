export interface User {
  _id: string;
  nome: string;
  email: string;
  senha: string;
  confirmarSenha: string;
  tipo: 'professor' | 'admin';
  departamento?: string;
  telefone?: string;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface RegisterRequest {
  nome: string;
  email: string;
  senha: string;
  departamento?: string;
  telefone?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

