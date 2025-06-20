import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Disciplina } from '../models/data.model';

interface DisciplinasResponse {
  data: Disciplina[];
  totalPages: number;
  currentPage: number;
  totalItems?: number;
}

@Injectable({
  providedIn: 'root'
})
export class DisciplinaService {
  private apiUrl = 'http://localhost:3000/api/disciplinas';

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

