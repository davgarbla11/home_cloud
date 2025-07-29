import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DialogService, DialogData } from '../../services/dialog.service';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.css']
})
export class ConfirmationDialogComponent implements OnDestroy {
  // Propiedades para controlar el estado y la vista del diálogo
  isOpen = false;
  title = '';
  message = '';
  confirmText = 'Confirmar';
  cancelText = 'Cancelar';
  dialogType: 'danger' | 'prompt' | 'info' = 'danger';
  dialogStatus: 'success' | 'error' | 'info' = 'info';
  
  // Propiedades para el prompt de texto
  showPrompt = false;
  promptLabel = '';
  inputValue = '';

  private subscription: Subscription;

  constructor(private dialogService: DialogService) {
    // Nos suscribimos a los cambios de estado del servicio de diálogo
    this.subscription = this.dialogService.dialogState$.subscribe(data => {
      // Comprobamos si 'data' no es nulo antes de usarlo
      if (data) {
        // Asignamos los valores a las propiedades del componente
        this.isOpen = true;
        this.title = data.title;
        this.message = data.message;
        this.confirmText = data.confirmText || 'Confirmar';
        this.cancelText = data.cancelText || 'Cancelar';
        this.dialogType = data.type || 'danger';
        this.dialogStatus = data.status || 'info';

        // Lógica específica para cuando se pide un prompt
        if (data.prompt) {
          this.showPrompt = true;
          this.promptLabel = data.prompt.label;
          this.inputValue = data.prompt.initialValue || '';
        } else {
          // Si no hay prompt, nos aseguramos de resetear su estado
          this.showPrompt = false;
          this.inputValue = '';
        }
      } else {
        // Si 'data' es nulo, el diálogo debe cerrarse
        this.isOpen = false;
      }
    });
  }

  onConfirm(): void {
    this.dialogService.confirm(this.inputValue);
  }

  onCancel(): void {
    this.dialogService.cancel();
  }

  // Buena práctica: desuscribirse cuando el componente se destruye para evitar fugas de memoria
  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}