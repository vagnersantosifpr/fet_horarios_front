// Alternativa usando função interceptor (Angular 15+)
// src/app/interceptors/auth-interceptor.ts

import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Verificar se a requisição é para a API e se há token disponível
  if (token && (
    req.url.startsWith('https://fet-horarios-back.onrender.com/api/') ||
    req.url.includes('/api/') ||
    req.url.includes('fet-horarios-back')
  )) {
    // Clonar a requisição e adicionar o cabeçalho Authorization
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return next(authReq);
  }

  return next(req);
};

