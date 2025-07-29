// Contenido para: src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http'; // Importa withInterceptors
import { routes } from './app.routes';
import { tokenInterceptor } from './services/token.interceptor'; // Importa tu interceptor

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    // Registra el interceptor para que se aplique a todas las peticiones HTTP
    provideHttpClient(withInterceptors([tokenInterceptor]))
  ]
};
