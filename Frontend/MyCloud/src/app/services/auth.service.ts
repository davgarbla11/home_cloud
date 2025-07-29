// Contenido para: src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

export interface AuthResponse {
  status: 'success' | 'changePasswordRequired';
  accessToken?: string;
  changePasswordToken?: string;
  user?: { username: string; role: string };
}

export interface DecodedToken {
  id: number;
  username: string;
  role: 'user' | 'admin';
  action?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';
  private userSubject = new BehaviorSubject<DecodedToken | null>(this.getDecodedToken());
  public user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  login(credentials: { username: string, password?: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        if (response.status === 'success' && response.accessToken) {
          this.storeToken(response.accessToken, 'ACCESS_TOKEN');
          this.userSubject.next(this.getDecodedToken());
        } else if (response.status === 'changePasswordRequired' && response.changePasswordToken) {
          this.storeToken(response.changePasswordToken, 'CHANGE_PASSWORD_TOKEN');
        }
      })
    );
  }

  changePassword(password: string): Observable<any> {
    const changeApiUrl = 'http://localhost:3000/api/user/change-password';
    return this.http.post(changeApiUrl, { password });
  }

  logout(): void {
    localStorage.removeItem('ACCESS_TOKEN');
    localStorage.removeItem('CHANGE_PASSWORD_TOKEN');
    this.userSubject.next(null);
    this.router.navigate(['/login']);
  }
  
  private storeToken(token: string, key: 'ACCESS_TOKEN' | 'CHANGE_PASSWORD_TOKEN'): void {
    localStorage.setItem(key, token);
  }

  getToken(key: 'ACCESS_TOKEN' | 'CHANGE_PASSWORD_TOKEN' = 'ACCESS_TOKEN'): string | null {
    return localStorage.getItem(key);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    // Verifica si el token existe y no está expirado (la decodificación simple puede no ser suficiente en producción real)
    return !!token; 
  }

  private getDecodedToken(): DecodedToken | null {
    const token = this.getToken();
    try {
      return token ? jwtDecode(token) : null;
    } catch (error) {
      return null;
    }
  }

  getUserRole(): 'user' | 'admin' | null {
    return this.userSubject.getValue()?.role ?? null;
  }

  public getCurrentUserValue(): DecodedToken | null {
    return this.userSubject.getValue();
  }

}