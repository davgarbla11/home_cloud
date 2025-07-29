// Contenido completo para: src/app/pages/admin-panel/admin-panel.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, catchError, of } from 'rxjs';
import { AdminService, User } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  // DatePipe se usa para formatear fechas, FormsModule para los formularios
  imports: [CommonModule, FormsModule, DatePipe], 
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.css']
})
export class AdminPanelComponent implements OnInit {
  users$: Observable<User[]> | undefined;
  
  // Objeto para el formulario de creación de nuevo usuario
  newUser = {
    username: '',
    password: ''
  };

  currentAdminId: number | null = null;

  constructor(
    private adminService: AdminService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.currentAdminId = this.authService.getCurrentUserValue()?.id ?? null;
  }

  loadUsers(): void {
    this.users$ = this.adminService.getUsers().pipe(
      catchError(error => {
        alert('Error al cargar la lista de usuarios.');
        console.error(error);
        return of([]); // Devuelve un array vacío en caso de error
      })
    );
  }

  onCreateUser(): void {
    if (!this.newUser.username || !this.newUser.password) {
      alert('Se requiere nombre de usuario y contraseña temporal.');
      return;
    }

    this.adminService.createUser(this.newUser).subscribe({
      next: () => {
        alert('Usuario creado con éxito.');
        this.loadUsers(); // Recargamos la lista
        this.newUser = { username: '', password: '' }; // Limpiamos el formulario
      },
      error: (err) => {
        alert(`Error al crear usuario: ${err.error.message || 'Error desconocido'}`);
      }
    });
  }

  onDeleteUser(user: User): void {
    if (user.id === this.currentAdminId) {
      alert('No puedes borrar tu propia cuenta.');
      return;
    }

    if (confirm(`¿Estás seguro de que quieres borrar al usuario "${user.username}"?`)) {
      this.adminService.deleteUser(user.id).subscribe({
        next: () => {
          alert('Usuario borrado con éxito.');
          this.loadUsers(); // Recargamos la lista
        },
        error: (err) => {
          alert(`Error al borrar usuario: ${err.error.message || 'Error desconocido'}`);
        }
      });
    }
  }
}