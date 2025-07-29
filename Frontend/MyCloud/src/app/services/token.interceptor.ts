// Contenido corregido para: src/app/services/token.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  let token: string | null = null;

  // Hacemos el interceptor más inteligente:
  // Si la petición va a '/change-password', usamos el token especial.
  if (req.url.includes('/user/change-password')) {
    token = authService.getToken('CHANGE_PASSWORD_TOKEN');
  } else {
    // Para todas las demás peticiones, usamos el token de acceso normal.
    token = authService.getToken('ACCESS_TOKEN');
  }

  if (token) {
    const clonedReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(clonedReq);
  }

  return next(req);
};