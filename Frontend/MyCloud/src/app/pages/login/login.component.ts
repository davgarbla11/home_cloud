// Contenido completo para: src/app/pages/login/login.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Necesario para ngModel
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule], // Importa FormsModule para los formularios
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  // Objeto para vincular los datos del formulario
  credentials = {
    username: '',
    password: ''
  };
  errorMessage = '';
  isLoading = false;

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit(): void {
    if (!this.credentials.username) {
      this.errorMessage = 'El nombre de usuario es requerido.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    
    this.authService.login(this.credentials).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.status === 'success') {
          // Si el login es exitoso, navegar a la página principal de la nube
          this.router.navigate(['/my-cloud']);
        } else if (response.status === 'changePasswordRequired') {
          // Si se requiere cambiar la contraseña, navegar a la página específica para ello
          this.router.navigate(['/change-password']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        // Muestra el mensaje de error que viene del backend o uno genérico
        this.errorMessage = err.error?.message || 'Error de conexión. Inténtalo de nuevo.';
      }
    });
  }
}