// src/app/interceptors/auth-interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
// CORREÇÃO DO CAMINHO DO IMPORT:
import { AuthService } from '../services/auth.service'; // <-- Use '../' para subir um nível

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService) {} // Este construtor é para a versão CLASSE

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.authService.getToken();
    
    if (token && request.url.startsWith('http://localhost:3000/api/')) { 
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
    return next.handle(request);
  }
}