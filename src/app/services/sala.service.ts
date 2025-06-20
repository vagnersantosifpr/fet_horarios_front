import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Sala } from '../models/data.model';

@Injectable({
  providedIn: 'root'
})
export class SalaService {
  private apiUrl = 'https://fet-horarios-back.onrender.com/api/salas';

  constructor(private http: HttpClient) {}

  getSalas(page: number = 1, limit: number = 10, search?: string): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<any>(this.apiUrl, { params });
  }

  getSala(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createSala(sala: Partial<Sala>): Observable<any> {
    return this.http.post<any>(this.apiUrl, sala);
  }

  updateSala(id: string, sala: Partial<Sala>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, sala);
  }

  deleteSala(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}

