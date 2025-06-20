import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Preferencia {
  disciplinas: {
    disciplina: string;
    preferencia: number;
  }[];
  disponibilidadeHorarios: {
    diaSemana: string;
    turno: string;
    horarios: {
      inicio: string;
      fim: string;
    }[];
    disponivel: boolean;
  }[];
  restricoes: {
    tipo: string;
    descricao: string;
    prioridade: number;
  }[];
  cargaHorariaMaxima: number;
  observacoes: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class PreferenciasService {
  private apiUrl = 'https://fet-horarios-back.onrender.com/api/preferencias';

  constructor(private http: HttpClient) { }

  // Obter minhas preferências
  getMinhasPreferencias(): Observable<ApiResponse<Preferencia>> {
    return this.http.get<ApiResponse<Preferencia>>(`${this.apiUrl}/minhas-preferencias`);
  }

  // Salvar minhas preferências
  salvarMinhasPreferencias(preferencias: Partial<Preferencia>): Observable<ApiResponse<Preferencia>> {
    return this.http.post<ApiResponse<Preferencia>>(`${this.apiUrl}/minhas-preferencias`, preferencias);
  }

  // Obter preferências completas (versão detalhada)
  getPreferenciasCompletas(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/my-preferences`);
  }

  // Salvar preferências completas (versão detalhada)
  salvarPreferenciasCompletas(preferencias: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/my-preferences`, preferencias);
  }

  // Adicionar disciplina às preferências
  adicionarDisciplina(disciplina: string, preferencia: number = 3): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/my-preferences/disciplinas`, {
      disciplina,
      preferencia
    });
  }

  // Remover disciplina das preferências
  removerDisciplina(disciplinaId: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/my-preferences/disciplinas/${disciplinaId}`);
  }

  // Adicionar disponibilidade de horário
  adicionarDisponibilidade(disponibilidade: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/my-preferences/disponibilidade`, disponibilidade);
  }

  // Adicionar restrição
  adicionarRestricao(restricao: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/my-preferences/restricoes`, restricao);
  }
}

