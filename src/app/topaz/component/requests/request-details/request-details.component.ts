import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { FormsModule } from '@angular/forms';

import { 
  RequestDetailsResponseModel, 
  RequestService,
  RequestStatusService,
  StatusDetailsResponseModel,
  GetRequest,
  ItemRequestModel,
  RequestItemService,
  AddItemRequestModel,
  RequestStatusHistoryNoteService,
  RequestStatusHistoryNoteRequestModel,
  ChangeStatusRequestModel
} from '@birthstonesdevops/topaz.backend.ordersservice';
import { 
  LocationService, 
  AreaService,
  LocationResponseModel,
  AreaResponseModel
} from '@birthstonesdevops/topaz.backend.organizationservice';
import { StatusNoteTreeComponent } from '../../shared/status-note-tree/status-note-tree.component';
import { ItemListComponent } from '../../shared/item-list/item-list.component';
import { Operations } from '../../models/operations.enum';

// Extended request interface for detailed display
interface EnrichedRequestDetails extends RequestDetailsResponseModel {
  areaName?: string;
  locationName?: string;
  currentStatus?: StatusDetailsResponseModel;
  currentOperations?: number[];
}

@Component({
  selector: 'app-request-details',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    ButtonModule, 
    ToastModule, 
    ProgressSpinnerModule, 
    TabsModule, 
    TagModule, 
    ToolbarModule,
    DialogModule,
    TextareaModule,
    StatusNoteTreeComponent, 
    ItemListComponent
  ],
  templateUrl: './request-details.component.html',
  styleUrl: './request-details.component.css',
  providers: [MessageService]
})
export class RequestDetailsComponent implements OnInit {
  requestId: number | null = null;
  requestDetails = signal<EnrichedRequestDetails | null>(null);
  loading = signal<boolean>(false);
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService,
    private requestService: RequestService,
    private requestStatusService: RequestStatusService,
    private requestItemService: RequestItemService,
    private requestStatusHistoryNoteService: RequestStatusHistoryNoteService,
    private areaService: AreaService,
    private locationService: LocationService
  ) {}

  ngOnInit() {
    // Get the ID from the route parameters
    this.route.params.subscribe(params => {
      this.requestId = params['id'] ? +params['id'] : null;
      if (this.requestId) {
        this.loadRequestDetails();
      }
    });
  }

  async loadRequestDetails() {
    if (!this.requestId) return;
    
    this.loading.set(true);
    this.error = null;
    
    try {
      console.log('Cargando detalles del pedido para ID:', this.requestId);
      
      // Get request details by ID
      const getRequest: GetRequest = { ids: [this.requestId] };
      const requestDetails = await this.requestService.requestGetRequestDetailsById(getRequest).toPromise();
      
      if (requestDetails) {
        // Enrich the request with additional information
        const enrichedRequest: EnrichedRequestDetails = { ...requestDetails };
        
        // Get area name
        if (requestDetails.areaId) {
          try {
            const area = await this.areaService.areaGetById({ ids: [requestDetails.areaId] }).toPromise();
            enrichedRequest.areaName = area?.name || 'N/A';
          } catch (error) {
            console.error('Error cargando departamento:', error);
            enrichedRequest.areaName = 'Error cargando departamento';
          }
        }
        
        // Get location name
        if (requestDetails.locationId) {
          try {
            const location = await this.locationService.locationGetById({ ids: [requestDetails.locationId] }).toPromise();
            enrichedRequest.locationName = location?.name || 'N/A';
          } catch (error) {
            console.error('Error cargando centro de producción:', error);
            enrichedRequest.locationName = 'Error cargando centro de producción';
          }
        }
        
        // Get current status (latest status from status history)
        if (requestDetails.statusHistory && requestDetails.statusHistory.length > 0) {
          const latestStatusHistory = requestDetails.statusHistory.sort((a, b) => 
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
              console.error('Error cargando detalles del estado:', error);
              enrichedRequest.currentOperations = [];
            }
          }
        }
        
        this.requestDetails.set(enrichedRequest);
      } else {
        this.error = 'Pedido no encontrado';
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se encontró el pedido solicitado'
        });
      }
    } catch (error) {
      console.error('Error cargando detalles del pedido:', error);
      this.error = 'Error cargando detalles del pedido';
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error cargando detalles del pedido'
      });
    } finally {
      this.loading.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/requests']);
  }

  // Check if specific operations are available
  canAddItems(): boolean {
    const operations = this.requestDetails()?.currentOperations || [];
    return operations.includes(Operations.AddRequestItem);
  }

  canDeleteItems(): boolean {
    const operations = this.requestDetails()?.currentOperations || [];
    return operations.includes(Operations.DeleteRequestItem);
  }

  canEditItems(): boolean {
    // For now, we'll allow editing if we can add or delete items
    return this.canAddItems() || this.canDeleteItems();
  }

  // Check if orders tab should be shown
  canShowOrdersTab(): boolean {
    const operations = this.requestDetails()?.currentOperations || [];
    const hasPurchaseOrders = !!(this.requestDetails()?.purchaseOrders && this.requestDetails()!.purchaseOrders!.length > 0);
    
    return (
      operations.includes(Operations.CreatePurchaseOrder) ||
      operations.includes(Operations.DeletePurchaseOrder) ||
      hasPurchaseOrders
    );
  }

  // Check if approve/reject operations are available
  canReviseRequest(): boolean {
    const operations = this.requestDetails()?.currentOperations || [];
    return operations.includes(Operations.ReviseRequest);
  }

  canApproveRequest(): boolean {
    const operations = this.requestDetails()?.currentOperations || [];
    return operations.includes(Operations.ApproveRequest);
  }

  canRejectRequest(): boolean {
    const operations = this.requestDetails()?.currentOperations || [];
    return operations.includes(Operations.RejectRequest);
  }

  canShowApprovalToolbar(): boolean {
    return this.canApproveRequest() || this.canRejectRequest() || this.canReviseRequest();
  }

  // Status change dialog state
  showStatusDialog: boolean = false;
  statusAction: 'approve' | 'reject' | 'revise' | null = null;
  statusNote: string = '';
  processingStatus = signal<boolean>(false);

  // Approval/Rejection handlers
  approveRequest(): void {
    this.statusAction = 'approve';
    this.statusNote = '';
    this.showStatusDialog = true;
  }

  rejectRequest(): void {
    this.statusAction = 'reject';
    this.statusNote = '';
    this.showStatusDialog = true;
  }

  reviseRequest(): void {
    this.statusAction = 'revise';
    this.statusNote = '';
    this.showStatusDialog = true;
  }

  cancelStatusChange(): void {
    this.showStatusDialog = false;
    this.statusAction = null;
    this.statusNote = '';
  }

  async executeStatusChange(): Promise<void> {
    if (!this.requestId || !this.statusAction) return;

    this.processingStatus.set(true);

    try {
      const changeStatusRequest: ChangeStatusRequestModel = {
        id: this.requestId,
        notes: this.statusNote.trim() ? [{ note: this.statusNote.trim() }] : undefined
      };

      switch (this.statusAction) {
        case 'approve':
          await this.requestService.requestApproveRequest(changeStatusRequest).toPromise();
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Pedido aprobado correctamente'
          });
          break;
        case 'revise':
          await this.requestService.requestReviseRequest(changeStatusRequest).toPromise();
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Pedido revisado correctamente'
          });
          break;
        case 'reject':
          await this.requestService.requestRejectRequest(changeStatusRequest).toPromise();
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Pedido rechazado correctamente'
          });
          break;
      }

      // Reload request details to show updated status
      await this.loadRequestDetails();
      this.cancelStatusChange();

    } catch (error) {
      console.error(`Error ${this.statusAction === 'approve' ? 'aprobando' : this.statusAction === 'reject' ? 'rechazando' : 'revisando'} pedido:`, error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: `Error al ${this.statusAction === 'approve' ? 'aprobar' : this.statusAction === 'reject' ? 'rechazar' : 'revisar'} el pedido`
      });
    } finally {
      this.processingStatus.set(false);
    }
  }

  getStatusActionText(): string {
    switch (this.statusAction) {
      case 'approve': return 'aprobar';
      case 'reject': return 'rechazar';
      case 'revise': return 'revisar';
      default: return '';
    }
  }

  getStatusActionTitle(): string {
    switch (this.statusAction) {
      case 'approve': return 'Aprobar Pedido';
      case 'reject': return 'Rechazar Pedido';
      case 'revise': return 'Revisar Pedido';
      default: return '';
    }
  }

  getStatusActionIcon(): string {
    switch (this.statusAction) {
      case 'approve': return 'pi pi-check-circle';
      case 'reject': return 'pi pi-times-circle';
      case 'revise': return 'pi pi-pencil';
      default: return '';
    }
  }

  getStatusActionButtonClass(): string {
    switch (this.statusAction) {
      case 'approve': return 'p-button-success';
      case 'reject': return 'p-button-danger';
      case 'revise': return 'p-button-info';
      default: return '';
    }
  }

  // Note addition handler
  addNoteHandler = async (newNote: { id: number; note: string }) => {
    try {
      console.log('Agregando nota:', newNote);
      
      const noteRequest: RequestStatusHistoryNoteRequestModel = {
        requestStatusHistoryId: newNote.id,
        note: newNote.note
      };
      
      const createdNote = await this.requestStatusHistoryNoteService
        .requestStatusHistoryNoteCreate(noteRequest)
        .toPromise();
      
      if (createdNote) {
        // Update the status history with the new note
        this.requestDetails.update(currentDetails => {
          if (!currentDetails?.statusHistory) return currentDetails;
          
          const updatedStatusHistory = currentDetails.statusHistory.map(statusHistory => {
            if (statusHistory.id === newNote.id) {
              return {
                ...statusHistory,
                notes: [...(statusHistory.notes || []), createdNote]
              };
            }
            return statusHistory;
          });
          
          return {
            ...currentDetails,
            statusHistory: updatedStatusHistory
          };
        });
        
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Nota agregada correctamente'
        });
      }
      
    } catch (error) {
      console.error('Error agregando nota:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al agregar la nota'
      });
    }
  };

  // Item operation handlers
  addItemHandler = async (item: ItemRequestModel) => {
    if (!this.requestId) return;
    
    try {
      console.log('Agregando artículo:', item);
      
      const addItemRequest: AddItemRequestModel = {
        id: this.requestId,
        items: [item]
      };
      
      await this.requestItemService.requestItemAddRequestItem(addItemRequest).toPromise();
      
      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Artículo agregado correctamente'
      });
      
      // Reload request details to show updated items
      await this.loadRequestDetails();
      
    } catch (error) {
      console.error('Error agregando artículo:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al agregar el artículo'
      });
    }
  };

  editItemHandler = async (data: { itemId: number; correspondentEntityId?: number; quantity: number }) => {
    if (!this.requestId) return;
    
    try {
      console.log('Editando artículo:', data);
      
      // For editing, we use the same add method with updated quantity
      const editItemRequest: AddItemRequestModel = {
        id: this.requestId,
        items: [{
          itemId: data.itemId,
          quantity: data.quantity
        }]
      };
      
      await this.requestItemService.requestItemAddRequestItem(editItemRequest).toPromise();
      
      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Cantidad del artículo actualizada correctamente'
      });
      
      // Reload request details to show updated items
      await this.loadRequestDetails();
      
    } catch (error) {
      console.error('Error editando artículo:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al actualizar la cantidad del artículo'
      });
    }
  };

  deleteItemHandler = async (data: { itemId: number; correspondentEntityId?: number }) => {
    if (!this.requestId) return;
    
    try {      
      const entityIdToDelete = data.correspondentEntityId!;
      await this.requestItemService.requestItemDeleteRequestItems(entityIdToDelete).toPromise();
      
      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Artículo eliminado correctamente'
      });
      
      // Reload request details to show updated items
      await this.loadRequestDetails();
      
    } catch (error) {
      console.error('Error eliminando artículo:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al eliminar el artículo'
      });
    }
  };

  // Utility methods
  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
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
}
