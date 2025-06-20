import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
//import { Disciplina } from '../models/data.model';

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

interface DisciplinasResponse {
  data: Disciplina[];
  totalPages: number;
  currentPage: number;
  totalItems?: number;
}

// Interface para as disciplinas selecionadas pelo professor
export interface DisciplinaSelecionadaPeloProfessor {
  disciplina: Disciplina; // O objeto disciplina completo
  preferencia: number;
}

// Interface para um item de disponibilidade/restrição de horário
// A interface `Preferencia` já define bem `disponibilidadeHorarios`
// mas para clareza no componente:
export interface DisponibilidadeItem {
  diaSemana: string;
  turno: string;
  horarios: {
    inicio: string;
    fim: string;
  }[];
  disponivel: boolean; // Presente na interface Preferencia, mas não usada no form de adição
}

@Injectable({
  providedIn: 'root'
})
export class DisciplinaService {
  private apiUrl = 'https://fet-horarios-back.onrender.com/api/disciplinas';

  constructor(private http: HttpClient) {}

  getDisciplinas(page: number = 1, limit: number = 10, searchTerm?: string): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (searchTerm && searchTerm.trim() !== '') {
      params = params.set('search', searchTerm);
    }

    return this.http.get<DisciplinasResponse>(this.apiUrl, { params });
  }

  getDisciplina(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createDisciplina(disciplina: Partial<Disciplina>): Observable<any> {
    return this.http.post<any>(this.apiUrl, disciplina);
  }

  updateDisciplina(id: string, disciplina: Partial<Disciplina>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, disciplina);
  }

  deleteDisciplina(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}

