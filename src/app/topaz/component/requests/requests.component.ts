import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { CreateRequestRequestModel } from '@birthstonesdevops/topaz.backend.ordersservice';
import { RequestCreationDialogComponent } from './request-creation-dialog/request-creation-dialog.component';

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    ToastModule,
    RequestCreationDialogComponent
  ],
  templateUrl: './requests.component.html',
  styleUrl: './requests.component.css',
  providers: [MessageService]
})
export class RequestsComponent {
  showCreateDialog: boolean = false;

  constructor(private messageService: MessageService) {}

  openCreateDialog() {
    this.showCreateDialog = true;
  }

  handleRequestCreated(request: CreateRequestRequestModel) {
    console.log('New request created:', request);
    
    // Show success message
    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Solicitud creada correctamente'
    });

    // Hide dialog
    this.showCreateDialog = false;

    // Here you would typically call a service to save the request
    // Example: this.requestService.createRequest(request).subscribe(...)
  }
}
