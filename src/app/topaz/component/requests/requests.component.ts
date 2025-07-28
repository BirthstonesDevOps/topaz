import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { InputTextModule } from 'primeng/inputtext';
import { InputIconModule } from 'primeng/inputicon';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { 
  CreateRequestRequestModel, 
  RequestDetailsResponseModel, 
  RequestService,
  RequestStatusService,
  ChangeStatusRequestModel,
  NoteRequestModel,
  StatusHistoryDetailsResponseModel,
  StatusDetailsResponseModel,
  StatusFullDetailsResponseModel
} from '@birthstonesdevops/topaz.backend.ordersservice';
import { 
  LocationService, 
  AreaService,
  LocationResponseModel,
  AreaResponseModel,
  GetRequest
} from '@birthstonesdevops/topaz.backend.organizationservice';
import { RequestCreationDialogComponent } from './request-creation-dialog/request-creation-dialog.component';
import { RequestOperations } from './models/request-operations.enum';
import { ToolbarModule } from "primeng/toolbar";
import { IconFieldModule } from "primeng/iconfield";

// Extended request interface for table display
interface RequestTableData extends RequestDetailsResponseModel {
  areaName?: string;
  locationName?: string;
  currentStatus?: StatusDetailsResponseModel;
  currentOperations?: number[];
}

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
    TableModule,
    TagModule,
    DialogModule,
    TextareaModule,
    ConfirmDialogModule,
    RequestCreationDialogComponent,
    ToolbarModule,
    IconFieldModule
],
  templateUrl: './requests.component.html',
  styleUrl: './requests.component.css',
  providers: [MessageService, ConfirmationService]
})
export class RequestsComponent implements OnInit {
  showCreateDialog: boolean = false;
  
  // Loading state
  loading = signal<boolean>(false);
  
  // Requests data
  allRequests = signal<RequestTableData[]>([]);
  
  // Search functionality
  searchTerm: string = '';
  
  // Delete confirmation dialog
  showDeleteDialog: boolean = false;
  deleteRequestId: number | null = null;
  deleteNotes: string = '';
  deletingRequest = signal<boolean>(false);
  
  // Computed filtered requests
  requests = computed(() => {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) return this.allRequests();
    
    return this.allRequests().filter(request => 
      request.areaName?.toLowerCase().includes(term) ||
      request.locationName?.toLowerCase().includes(term) ||
      request.currentStatus?.status?.toLowerCase().includes(term) ||
      request.id?.toString().includes(term)
    );
  });

  constructor(
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private requestService: RequestService,
    private requestStatusService: RequestStatusService,
    private areaService: AreaService,
    private locationService: LocationService
  ) {}

  ngOnInit() {
    this.loadRequests();
  }

  async loadRequests() {
    this.loading.set(true);
    try {
      // Get all request details
      const requests = await this.requestService.requestGetAllRequestDetails().toPromise();
      
      if (requests) {
        // Enrich requests with area and location names, and current status
        const enrichedRequests = await Promise.all(
          requests.map(async (request) => {
            const enrichedRequest: RequestTableData = { ...request };
            
            // Get area name
            if (request.areaId) {
              try {
                const area = await this.areaService.areaGetById({ ids: [request.areaId] }).toPromise();
                enrichedRequest.areaName = area?.name || 'N/A';
              } catch (error) {
                enrichedRequest.areaName = 'Error';
              }
            }
            
            // Get location name
            if (request.locationId) {
              try {
                const location = await this.locationService.locationGetById({ ids: [request.locationId] }).toPromise();
                enrichedRequest.locationName = location?.name || 'N/A';
              } catch (error) {
                enrichedRequest.locationName = 'Error';
              }
            }
            
            // Get current status (latest status from status history)
            if (request.statusHistory && request.statusHistory.length > 0) {
              const latestStatusHistory = request.statusHistory.sort((a, b) => 
                new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
              )[0];
              enrichedRequest.currentStatus = latestStatusHistory.status || undefined;
              
              // Get status details and operations if we have a current status
              if (enrichedRequest.currentStatus?.id) {
                try {
                  const statusDetails = await this.requestStatusService
                    .requestStatusGetRequestStatusDetailsById({ ids: [enrichedRequest.currentStatus.id] })
                    .toPromise();
                  
                  if (statusDetails?.operations) {
                    // Extract distinct operation IDs
                    const operationIds = statusDetails.operations
                      .map(op => op.operationId)
                      .filter((id): id is number => id !== undefined && id !== null)
                      .filter((id, index, arr) => arr.indexOf(id) === index); // Remove duplicates
                    
                    enrichedRequest.currentOperations = operationIds;
                  }
                } catch (error) {
                  console.error('Error loading status details:', error);
                  enrichedRequest.currentOperations = [];
                }
              }
            }
            
            return enrichedRequest;
          })
        );
        
        this.allRequests.set(enrichedRequests);
      }
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

  async handleRequestCreated(request: CreateRequestRequestModel) {
    try {
      // Create the request using the service
      const createdRequest = await this.requestService.requestCreateRequest(request).toPromise();
      
      if (createdRequest) {
        // Reload all requests to get the updated list
        await this.loadRequests();
        
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Solicitud creada correctamente'
        });
      }
    } catch (error) {
      console.error('Error creating request:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error creando la solicitud'
      });
    }

    this.showCreateDialog = false;
  }

  // Delete functionality
  confirmDelete(requestId: number) {
    this.deleteRequestId = requestId;
    this.deleteNotes = '';
    this.showDeleteDialog = true;
  }

  cancelDelete() {
    this.showDeleteDialog = false;
    this.deleteRequestId = null;
    this.deleteNotes = '';
  }

  async executeDelete() {
    if (!this.deleteRequestId) return;

    this.deletingRequest.set(true);
    
    try {
      const deleteRequest: ChangeStatusRequestModel = {
        id: this.deleteRequestId,
        notes: this.deleteNotes.trim() ? [{ note: this.deleteNotes.trim() }] : undefined
      };

      await this.requestService.requestDeleteRequest(deleteRequest).toPromise();
      
      // Reload requests to get updated list and operations
      await this.loadRequests();
      
      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Solicitud eliminada correctamente'
      });
      
      this.cancelDelete();
    } catch (error) {
      console.error('Error deleting request:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error eliminando la solicitud'
      });
    } finally {
      this.deletingRequest.set(false);
    }
  }

  // Utility methods
  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  getStatusSeverity(tag: string | null | undefined): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" {
    if (!tag) return 'secondary';
    
    switch (tag.toLowerCase()) {
      case 'success': return 'success';
      case 'danger': return 'danger';
      case 'warning': case 'warn': return 'warn';
      case 'info': return 'info';
      case 'contrast': return 'contrast';
      default: return 'secondary';
    }
  }

  // Operation availability checks
  canDeleteRequest(request: RequestTableData): boolean {
    return request.currentOperations?.includes(RequestOperations.DeleteRequest) ?? false;
  }

  canEditRequest(request: RequestTableData): boolean {
    return (request.currentOperations?.includes(RequestOperations.AddRequestItem) ?? false) ||
           (request.currentOperations?.includes(RequestOperations.DeleteRequestItem) ?? false);
  }

  // Edit functionality (placeholder for now)
  editRequest(requestId: number) {
    console.log('Edit request:', requestId);
    // TODO: Implement edit functionality
    this.messageService.add({
      severity: 'info',
      summary: 'Info',
      detail: 'Funcionalidad de edición próximamente disponible'
    });
  }
}
