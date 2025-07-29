// src/app/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpRequest, HttpEvent, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// Definimos una interfaz para el tipo de datos que recibiremos
export interface FileSystemItem {
  name: string;
  isDirectory: boolean;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = 'http://localhost:3000/api/files'; // O la IP de la Pi

  constructor(private http: HttpClient) {}

  // Nuevo método para navegar por directorios
  browse(path: string): Observable<FileSystemItem[]> {
    // La ruta vacía significa la raíz
    return this.http.get<FileSystemItem[]>(`${this.baseUrl}/browse/${path}`);
  }
  uploadWithProgress(file: File, path: string, encodedPath: string): Observable<HttpEvent<any>> {
    const formData = new FormData();
    formData.append('path', path);
    // El 'encodedPath' será nuestro nombre de archivo modificado
    formData.append('file', file, encodedPath);

    const req = new HttpRequest('POST', `${this.baseUrl}/upload`, formData, {
      reportProgress: true,
    });
    return this.http.request(req);
  }

  createFolder(path: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/create-folder`, { path });
  }

  // Modificado para aceptar la ruta y si es un directorio
  deleteItem(path: string, isDirectory: boolean): Observable<any> {
    // La petición DEBE enviar un cuerpo (body) con ambos datos
    return this.http.request('delete', `${this.baseUrl}/delete`, {
      body: { path, isDirectory }
    });
  }

  // La URL de descarga ahora necesita la ruta completa
  downloadFile(path: string): Observable<Blob> {
    const url = `${this.baseUrl}/download/${path}`;
    // Hacemos la petición y le decimos a Angular que esperamos
    // la respuesta como un objeto binario (blob).
    return this.http.get(url, {
      responseType: 'blob' 
    });
  }

  // Descargar varios ficheros

  downloadMultiple(filesToZip: string[]): Observable<Blob> {
    const url = `${this.baseUrl}/download-multiple`;
    // Hacemos una petición POST enviando el array de rutas en el body
    return this.http.post(url, { filesToZip }, {
      responseType: 'blob'
    });
  }

  
}