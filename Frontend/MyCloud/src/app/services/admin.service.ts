// Contenido completo para: src/app/services/admin.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interfaz para definir la estructura de un usuario que recibimos del backend
export interface User {
  id: number;
  username: string;
  role: 'user' | 'admin';
  created_at: string;
  is_temporary_password: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = 'http://localhost:3000/api/admin';

  constructor(private http: HttpClient) { }

  // Obtiene la lista de todos los usuarios
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }

  // Crea un nuevo usuario con una contraseña temporal
  createUser(userData: { username: string, password?: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/users`, userData);
  }

  // Borra un usuario por su ID
  deleteUser(userId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${userId}`);
  }
}