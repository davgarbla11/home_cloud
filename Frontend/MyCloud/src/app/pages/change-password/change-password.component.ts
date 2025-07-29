// Contenido completo para: src/app/pages/change-password/change-password.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent {
  passwords = {
    password: '',
    confirmPassword: ''
  };
  errorMessage = '';
  successMessage = '';
  isLoading = false;

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit(): void {
    // Limpiar mensajes previos
    this.errorMessage = '';
    this.successMessage = '';

    // Validaciones
    if (this.passwords.password !== this.passwords.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      return;
    }
    if (this.passwords.password.length < 6) {
      this.errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
      return;
    }

    this.isLoading = true;
    this.authService.changePassword(this.passwords.password).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.successMessage = res.message + " Serás redirigido al login en 3 segundos.";
        
        // Forzamos el logout para que inicie sesión con la nueva contraseña
        setTimeout(() => {
          this.authService.logout();
        }, 3000);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Error al cambiar la contraseña.';
      }
    });
  }
}