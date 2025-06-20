import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'https://fet-horarios-back.onrender.com/api/auth';

  constructor(private http: HttpClient) {}

  getUsers(page: number = 1, limit: number = 10, search?: string): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<any>(`${this.apiUrl}/users`, { params });
  }

  getUser(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/users/${id}`);
  }

  createUser(user: Partial<User>): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, user);
  }

  updateUser(id: string, user: Partial<User>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/users/${id}`, user);
  }

  updateUserStatus(id: string, user: Partial<User>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/users/${id}`, user);
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/users/${id}`);
  }

  toggleUserStatus(id: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/users/${id}/toggle-status`, {});
  }
}

