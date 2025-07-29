import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.getUserRole() === 'admin') {
    return true;
  }
  
  // Si no es admin, lo redirigimos a su página principal
  router.navigate(['/my-cloud']);
  return false;
};