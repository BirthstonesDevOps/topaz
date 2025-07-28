import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { InputTextModule } from 'primeng/inputtext';
import { InputIconModule } from 'primeng/inputicon';

import { CreateRequestRequestModel } from '@birthstonesdevops/topaz.backend.ordersservice';
import { RequestCreationDialogComponent } from './request-creation-dialog/request-creation-dialog.component';
import { ToolbarModule } from "primeng/toolbar";
import { IconFieldModule } from "primeng/iconfield";

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    ToastModule,
    ProgressSpinnerModule,
    InputTextModule,
    InputIconModule,
    RequestCreationDialogComponent,
    ToolbarModule,
    IconFieldModule
],
  templateUrl: './requests.component.html',
  styleUrl: './requests.component.css',
  providers: [MessageService]
})
export class RequestsComponent {
  showCreateDialog: boolean = false;
  
  // Loading state
  loading = signal<boolean>(false);
  
  // Requests data (mock data for now)
  allRequests = signal<CreateRequestRequestModel[]>([]);
  
  // Search functionality
  searchTerm: string = '';
  
  // Computed filtered requests
  requests = computed(() => {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) return this.allRequests();
    
    // Filter requests based on search term
    // You can customize this filtering logic based on your request properties
    return this.allRequests().filter(request => 
      // Add filtering logic here when you have request properties to search
      true // Placeholder for now
    );
  });

  constructor(private messageService: MessageService) {
    // Load initial data
    this.loadRequests();
  }

  async loadRequests() {
    this.loading.set(true);
    try {
      // Here you would load requests from a service
      // For now, just simulate loading
      await new Promise(resolve => setTimeout(resolve, 1000));
      this.allRequests.set([]);
    } catch (error) {
      console.error('Error loading requests:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error cargando pedidos'
      });
    } finally {
      this.loading.set(false);
    }
  }

  filterRequests() {
    // The filtering is handled by the computed property
    // This method exists for the template binding
  }

  openCreateDialog() {
    this.showCreateDialog = true;
  }

  handleRequestCreated(request: CreateRequestRequestModel) {
    console.log('New request created:', request);
    
    // Add the new request to the list
    this.allRequests.update(requests => [...requests, request]);
    
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
