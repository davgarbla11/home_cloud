// Contenido completo para: src/app/app.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService, DecodedToken } from './services/auth.service';
import { ConfirmationDialogComponent } from './shared/confirmation-dialog/confirmation-dialog.component';
import { DialogService, DialogData } from './services/dialog.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ConfirmationDialogComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {
  // Creamos un observable para acceder a los datos del usuario en la plantilla
  user$: Observable<DecodedToken | null>;
  public dialogState$: Observable<DialogData | null>;

  constructor(public authService: AuthService, private dialogService: DialogService ) {
    // Nos conectamos al observable del servicio
    this.user$ = this.authService.user$;
    this.dialogState$ = this.dialogService.dialogState$;
  }
}