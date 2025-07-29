// Contenido para: src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { LoginComponent } from './pages/login/login.component';
import { ChangePasswordComponent } from './pages/change-password/change-password.component';
import { CloudExplorerComponent } from './pages/cloud-explorer/cloud-explorer.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { AdminPanelComponent } from './pages/admin-panel/admin-panel.component';

export const routes: Routes = [
  // Rutas públicas
  { path: 'login', component: LoginComponent },
  { path: 'change-password', component: ChangePasswordComponent },

  // Rutas protegidas para usuarios logueados
  { path: 'my-cloud', component: CloudExplorerComponent, canActivate: [authGuard] },
  { path: 'settings', component: SettingsComponent, canActivate: [authGuard] },
  
  // Ruta protegida solo para administradores
  { path: 'admin', component: AdminPanelComponent, canActivate: [authGuard, adminGuard] },

  // Redirecciones por defecto
  { path: '', redirectTo: '/my-cloud', pathMatch: 'full' },
  { path: '**', redirectTo: '/my-cloud' } // O a '/login' si prefieres
];
