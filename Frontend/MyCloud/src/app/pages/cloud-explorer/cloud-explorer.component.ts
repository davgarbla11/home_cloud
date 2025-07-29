// Contenido completo para: src/app/pages/cloud-explorer/cloud-explorer.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, switchMap, finalize, catchError, of } from 'rxjs';
import { ApiService, FileSystemItem } from '../../services/api.service';
import { DialogService } from '../../services/dialog.service';
import { firstValueFrom } from 'rxjs'; 

@Component({
  selector: 'app-cloud-explorer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cloud-explorer.component.html',
  styleUrls: ['./cloud-explorer.component.css']
})
export class CloudExplorerComponent implements OnInit {

  // --- Estado de Navegación ---
  private pathSubject = new BehaviorSubject<string>('');
  items$!: Observable<FileSystemItem[]>;
  currentPath: string[] = [];
  isLoading = true;

  public selectedItems = new Map<string, FileSystemItem>();

  toggleSelection(item: FileSystemItem, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this.selectedItems.set(item.name, item);
    } else {
      this.selectedItems.delete(item.name);
    }
  }

  isSelected(item: FileSystemItem): boolean {
    return this.selectedItems.has(item.name);
  }

  clearSelection(): void {
    this.selectedItems.clear();
    // Opcional: desmarcar visualmente los checkboxes si es necesario
  }

async onDeleteSelected(): Promise<void> {
    if (this.selectedItems.size === 0) {
      // Usamos nuestro nuevo diálogo de información en lugar de alert()
      this.dialogService.alert('Acción no válida', 'Por favor, selecciona al menos un elemento para borrar.', 'info');
      return;
    }

    // 1. Abrimos el diálogo y esperamos la confirmación del usuario.
    const confirmed = await this.dialogService.open({
      title: `Borrar ${this.selectedItems.size} elemento(s)`,
      message: '¿Estás seguro de que quieres borrar los elementos seleccionados? Esta acción no se puede deshacer.',
      confirmText: 'Sí, borrar todo',
      type: 'danger'
    });

    // 2. LA CLAVE: El código solo continúa si 'confirmed' es estrictamente 'true'.
    if (confirmed) {
      const deleteObservables = Array.from(this.selectedItems.values()).map(item => {
        const itemPath = [this.pathSubject.getValue(), item.name].filter(Boolean).join('/');
        
        // Llamada correcta a la API, que devuelve un Observable
        return this.apiService.deleteItem(itemPath, item.isDirectory);
      });

      try {
        // Usamos Promise.all para esperar a que todos los Observables se completen.
        // firstValueFrom convierte cada Observable en una Promesa.
        await Promise.all(deleteObservables.map(obs => firstValueFrom(obs)));
        
        // Mostramos un diálogo de éxito
        this.dialogService.alert('Borrado Completo', `Se han borrado ${this.selectedItems.size} elemento(s).`, 'success');

        this.clearSelection();
        this.pathSubject.next(this.pathSubject.getValue()); // Recargar
      } catch (error: any) {
        // Mostramos un diálogo de error
        this.dialogService.alert('Error', `Algunos elementos no se pudieron borrar: ${error.error?.message || 'Error de servidor'}`, 'error');
      }
    }
    // Si 'confirmed' es false, la función termina aquí y no se hace nada.
  }

  // --- Estado de Subida (Update de carpetas y mas de un fichero) ---
  selectedFiles: File[] = [];
  uploadProgress: { [key: string]: number } = {};
  uploadMessage = '';
  isUploading = false;

  constructor(
    public apiService: ApiService,
    private dialogService: DialogService
  ) {}

  getDisplayFileName(file: File): string {
    return (file as any).webkitRelativePath || file.name;
  }

  private lastUsedInput: HTMLInputElement | null = null;

  ngOnInit(): void {
    // Pipeline reactivo: cada vez que pathSubject emite un nuevo valor (ruta),
    // se cancela la petición anterior y se hace una nueva llamada a la API.
    this.items$ = this.pathSubject.pipe(
      switchMap(path => {
        this.isLoading = true;
        return this.apiService.browse(path).pipe(
          finalize(() => this.isLoading = false),
          catchError(error => {
            alert('Error al cargar la carpeta. Puede que no exista.');
            console.error(error);
            return of([]); // Devuelve un array vacío en caso de error
          })
        );
      })
    );

    // Suscripción para mantener actualizadas las migas de pan (breadcrumbs)
    this.pathSubject.subscribe(path => {
      this.currentPath = path.split('/').filter(p => p.length > 0);
    });
  }

  // --- Métodos de Navegación ---

  navigateTo(folderName: string): void {
    const newPath = [...this.currentPath, folderName].join('/');
    this.pathSubject.next(newPath);
  }

  navigateToCrumb(index: number): void {
    const newPath = this.currentPath.slice(0, index + 1).join('/');
    this.pathSubject.next(newPath);
  }

  navigateToRoot(): void {
    this.pathSubject.next('');
  }

  // --- Métodos de Acción ---

  onFileSelected(event: any): void {
    const files: FileList = event.target.files;
    this.lastUsedInput = event.target as HTMLInputElement; // Guardamos el input que disparó el evento

    if (files.length > 0) {
      
      this.selectedFiles = Array.from(files);
      
      this.uploadProgress = {};
    }
  }

  private uploadFile(file: File, basePath: string, relativePath: string): Promise<any> {
    
    const SEPARATOR = '--!!--';
    const encodedPath = relativePath.replace(/\//g, SEPARATOR);
    console.log(`[Frontend] Enviando archivo con path codificado: ${encodedPath}`);

    return new Promise((resolve, reject) => {
      // Llamamos a nuestro servicio (que devuelve un Observable).
      this.apiService.uploadWithProgress(file, basePath, encodedPath).subscribe({
        next: (event) => {
          if (event.type === HttpEventType.UploadProgress) {
            // Calculamos el progreso y lo guardamos en nuestro objeto 'uploadProgress',
            // usando el nombre del archivo como clave.
            const progress = Math.round(100 * (event.loaded / (event.total || 1)));
            this.uploadProgress[file.name] = progress;
          } else if (event instanceof HttpResponse) {
            // La subida de ESTE archivo ha terminado con éxito.
            this.uploadProgress[file.name] = 100;
            resolve(event); // Resolvemos la promesa, indicando éxito.
          }
        },
        error: (err) => {
          // Si hay un error, lo marcamos en el progreso.
          this.uploadProgress[file.name] = -1; 
          reject(err); // Rechazamos la promesa, indicando fallo.
        }
      });
    });
  }


  async onUpload(): Promise<void> {
    if (this.selectedFiles.length === 0) {
      return;
    }

    this.isUploading = true;
    const currentPath = this.pathSubject.getValue();

    const uploadPromises = this.selectedFiles.map(file => {
      const filePathForUpload = (file as any).webkitRelativePath || file.name;
      console.log(`Subiendo archivo: ${file.name}, con ruta relativa: ${filePathForUpload}`);
      return this.uploadFile(file, currentPath, filePathForUpload);
    });

    try {
      await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Al menos una de las subidas falló.', error);
      alert('Algunos archivos no se pudieron subir. Revisa la consola para más detalles.');
    }

    this.isUploading = false;
    this.selectedFiles = [];
    
    const fileInput = document.querySelector('#fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    
    if (this.lastUsedInput) {
      this.lastUsedInput.value = '';
      this.lastUsedInput = null; // Reseteamos la referencia
    }

    this.pathSubject.next(currentPath);
  }

  async onCreateFolder(): Promise<void> {
  // Llamamos a nuestro nuevo diálogo
    const result = await this.dialogService.open({
      title: 'Nueva Carpeta',
      message: 'Introduce el nombre para la nueva carpeta que quieres crear.',
      confirmText: 'Crear',
      type: 'prompt',
      prompt: {
        label: 'Nombre de la carpeta'
      }
    });

    // Si el usuario confirmó y escribió un nombre...
    if (result.confirmed && result.value && result.value.trim().length > 0) {
      const folderName = result.value.trim();
      const currentPath = this.pathSubject.getValue();
      const newFolderPath = [currentPath, folderName].filter(Boolean).join('/');
      
      this.apiService.createFolder(newFolderPath).subscribe({
        next: () => {
          this.pathSubject.next(currentPath); // Recargar la vista actual
        },
        error: (err) => alert('Error al crear la carpeta: ' + (err.error?.message || 'Error desconocido'))
      });
    }
  }

  async onDeleteItem(item: FileSystemItem): Promise<void> {
    
    const confirmed = await this.dialogService.open({
      title: 'Confirmar Borrado',
      message: `¿Estás seguro de que quieres borrar permanentemente "${item.name}"? Esta acción no se puede deshacer.`,
      confirmText: 'Sí, borrar',
      cancelText: 'Cancelar'
    });
    
    // El código solo continuará si la promesa se resuelve a 'true'
    if (confirmed) {
      const currentPath = this.pathSubject.getValue();
      const itemPath = [currentPath, item.name].filter(Boolean).join('/');
      
      // LA LLAMADA CORRECTA: Pasamos tanto la ruta como el booleano 'isDirectory' del objeto 'item'
      this.apiService.deleteItem(itemPath, item.isDirectory).subscribe({
        next: () => {
          // Opcional: mostrar una notificación de éxito aquí
          this.pathSubject.next(currentPath); // Recargar la vista
        },
        error: (err) => {
          // Opcional: mostrar una notificación de error aquí
          const errorMessage = err.error?.message || 'Error desconocido';
          alert('Error al borrar el elemento: ' + errorMessage);
        }
      });
    }
  }

  // --- Métodos Auxiliares ---
  
  // Construye la URL completa para la descarga
  onDownloadFile(item: FileSystemItem): void {
    const fullPath = [this.pathSubject.getValue(), item.name].filter(Boolean).join('/');
    
    this.apiService.downloadFile(fullPath).subscribe(
      (blob) => {
        // Crea un enlace temporal en memoria
        const a = document.createElement('a');
        const objectUrl = URL.createObjectURL(blob);
        a.href = objectUrl;
        a.download = item.name; // El nombre que tendrá el archivo al descargarse
        
        // Simula un clic en el enlace para iniciar la descarga
        a.click();

        // Limpia la URL del objeto para liberar memoria
        URL.revokeObjectURL(objectUrl);
      },
      (error) => {
        alert('Error al descargar el archivo.');
        console.error('Error de descarga:', error);
      }
    );
  }

  navigateUp(): void {
    // Si no estamos en la raíz (currentPath tiene elementos)
    if (this.currentPath.length > 0) {
      // Creamos una nueva ruta eliminando el último elemento del array
      const parentPath = this.currentPath.slice(0, -1).join('/');
      this.pathSubject.next(parentPath);
    }
  }

  // Añado iconos dinamicos:

  getIconForFile(filename: string): string {
    // Obtenemos la extensión en minúsculas
    const extension = filename.split('.').pop()?.toLowerCase() || '';

    // Mapeo de extensiones a iconos de Font Awesome
    switch (extension) {
      // Documentos de Office
      case 'pdf':
        return 'fa-solid fa-file-pdf';
      case 'doc':
      case 'docx':
        return 'fa-solid fa-file-word';
      case 'xls':
      case 'xlsx':
        return 'fa-solid fa-file-excel';
      case 'ppt':
      case 'pptx':
        return 'fa-solid fa-file-powerpoint';
      
      // Archivos de Imagen
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'heic':
      case 'gif':
      case 'bmp':
      case 'webp':
        return 'fa-solid fa-file-image';

      // Archivos de Audio
      case 'mp3':
      case 'wav':
      case 'ogg':
      case 'aac':
        return 'fa-solid fa-file-audio';

      // Archivos de Vídeo
      case 'mp4':
      case 'mov':
      case 'avi':
      case 'mkv':
        return 'fa-solid fa-file-video';

      // Archivos Comprimidos
      case 'zip':
      case 'rar':
      case '7z':
      case 'tar':
      case 'gz':
        return 'fa-solid fa-file-zipper'; // o fa-file-archive

      // Código y Texto
      case 'js':
        return 'fa-brands fa-js'; // Icono de JavaScript

      case 'html':
        return 'fa-brands fa-html5'; // Icono de HTML5

      case 'c':
      case 'cpp': // Podemos agruparlos
        return 'fa-solid fa-file-code'; // O una alternativa creativa como 'fa-solid fa-c'

    
      case 'txt': return 'fa-solid fa-file-lines';
      case 'json': case 'ts': case 'css': return 'fa-solid fa-file-code';
      
      // Si no coincide con ninguna, devolvemos un icono de archivo genérico
      default:
        return 'fa-solid fa-file';
    }
  }

  // Descarga de multiples-ficheros 04/07/2025

  async onDownloadSelected(): Promise<void> {
    const selectedItems = Array.from(this.selectedItems.values());
    if (selectedItems.length === 0) return;

    // CASO 1: Solo se ha seleccionado un archivo
    if (selectedItems.length === 1 && !selectedItems[0].isDirectory) {
      this.onDownloadFile(selectedItems[0]); // Usamos la función de descarga individual que ya teníamos
      return;
    }

    // CASO 2: Se han seleccionado múltiples ítems o una/s carpeta/s
    // Necesitamos construir una lista plana de todas las rutas de archivos a descargar
    alert('Preparando la descarga del archivo ZIP. Esto puede tardar un momento...');
    
    const filesToDownload: string[] = [];
    // Usamos un bucle for...of para poder usar await dentro
    for (const item of selectedItems) {
      const itemPath = [this.pathSubject.getValue(), item.name].filter(Boolean).join('/');
      if (item.isDirectory) {
        // Si es un directorio, necesitamos obtener todos los archivos que contiene
        const filesInside = await this.getAllFilesFromDirectory(itemPath);
        filesToDownload.push(...filesInside);
      } else {
        // Si es un archivo, simplemente lo añadimos a la lista
        filesToDownload.push(itemPath);
      }
    }

    if (filesToDownload.length > 0) {
      this.apiService.downloadMultiple(filesToDownload).subscribe(
        (blob) => {
          const a = document.createElement('a');
          const objectUrl = URL.createObjectURL(blob);
          a.href = objectUrl;
          a.download = 'MiNube-archivos.zip'; // Nombre del archivo zip
          a.click();
          URL.revokeObjectURL(objectUrl);
          this.clearSelection();
        },
        (error) => alert('Error al generar el archivo .zip.')
      );
    }
  }

  private async getAllFilesFromDirectory(directoryPath: string): Promise<string[]> {
    let allFiles: string[] = [];
    try {
      // Usamos toPromise() para poder usar await con el observable
      const items = await this.apiService.browse(directoryPath).toPromise();
      
      if (items) {
        for (const item of items) {
          const itemPath = `${directoryPath}/${item.name}`;
          if (item.isDirectory) {
            // Si es otra carpeta, llamamos recursivamente a la función
            const nestedFiles = await this.getAllFilesFromDirectory(itemPath);
            allFiles = allFiles.concat(nestedFiles);
          } else {
            // Si es un archivo, lo añadimos a la lista
            allFiles.push(itemPath);
          }
        }
      }
    } catch (error) {
      console.error(`Error al explorar el directorio ${directoryPath}`, error);
    }
    return allFiles;
  }

}