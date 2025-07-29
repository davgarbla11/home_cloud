// Contenido completo y revisado para: src/app/services/dialog.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface DialogData { 
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'prompt' | 'info';
  
  // --- AÑADE ESTA LÍNEA ---
  status?: 'success' | 'error' | 'info'; // Para el estilo del icono y el botón

  prompt?: {
    label: string;
    initialValue?: string;
  };
}
export interface DialogResult { confirmed: boolean; value?: string; }

@Injectable({ providedIn: 'root' })
export class DialogService {
  private dialogState = new BehaviorSubject<DialogData | null>(null);
  public dialogState$ = this.dialogState.asObservable();
  private resolveAction: ((value: DialogResult) => void) | null = null;

  constructor() { }

  open(data: DialogData): Promise<DialogResult> {
    console.log('[DialogService] Abriendo diálogo con datos:', data);
    const fullData: DialogData = { type: 'info', status: 'info', ...data };
    this.dialogState.next(fullData);

    return new Promise<DialogResult>((resolve) => {
      this.resolveAction = resolve;
    });
  }

  confirm(value?: string): void {
    console.log('[DialogService] Acción CONFIRMADA con valor:', value);
    if (this.resolveAction) {
      this.resolveAction({ confirmed: true, value: value });
    }
    this.close();
  }

  cancel(): void {
    console.log('[DialogService] Acción CANCELADA');
    if (this.resolveAction) {
      this.resolveAction({ confirmed: false });
    }
    this.close();
  }

  private close(): void {
    console.log('[DialogService] Cerrando diálogo.');
    this.dialogState.next(null);
    this.resolveAction = null;
  }
  
  // Tu método alert se queda igual
  async alert(title: string, message: string, status: 'success' | 'error' | 'info' = 'info'): Promise<boolean> {
      const result = await this.open({ title, message, type: 'info', status: status, confirmText: 'Aceptar' });
      return result.confirmed;
  }
}