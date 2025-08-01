import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { CarouselModule } from 'primeng/carousel';
import { FormsModule } from '@angular/forms';

import { 
  PurchaseOrderDetailsResponseModel,
  PurchaseOrderService,
  PurchaseOrderItemService,
  AddItemRequestModel,
  PurchaseOrderStatusHistoryNoteService,
  PurchaseOrderStatusHistoryNoteRequestModel,
  ItemRequestModel,
  RequestService,
  RequestDetailsResponseModel,
  GetRequest,
  ItemDetailsResponseModel,
  PurchaseOrderStatusService,
  StatusFullDetailsResponseModel,
  PurchaseOrderDeliveryDetailsResponseModel
} from '@birthstonesdevops/topaz.backend.ordersservice';
import { 
  ProviderService,
  ProviderDetailsResponseModel
} from '@birthstonesdevops/topaz.backend.organizationservice';
import { StatusNoteTreeComponent } from '../../shared/status-note-tree/status-note-tree.component';
import { ItemListComponent } from '../../shared/item-list/item-list.component';
import { OrderDeliveryDetailsComponent } from '../order-delivery-details/order-delivery-details.component';
import { Operations } from '../../models/operations.enum';
import { OrderDeliveryCreationDialogComponent } from "../order-delivery-creation-dialog/order-delivery-creation-dialog.component";

// Extended purchase order interface for detailed display
interface EnrichedPurchaseOrderDetails extends PurchaseOrderDetailsResponseModel {
  providerDetails?: ProviderDetailsResponseModel;
  currentStatus?: any;
  currentOperations?: number[];
}

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    ToastModule,
    ProgressSpinnerModule,
    TabsModule,
    TagModule,
    CarouselModule,
    StatusNoteTreeComponent,
    ItemListComponent,
    OrderDeliveryDetailsComponent,
    OrderDeliveryCreationDialogComponent
],
  templateUrl: './order-details.component.html',
  styleUrl: './order-details.component.css',
  providers: [MessageService]
})
export class OrderDetailsComponent implements OnInit {
  orderId: number | null = null;
  orderDetails = signal<EnrichedPurchaseOrderDetails | null>(null);
  requestDetails = signal<RequestDetailsResponseModel | null>(null);
  pendingItems = signal<ItemDetailsResponseModel[]>([]);
  loading = signal<boolean>(false);
  error: string | null = null;

  // Delivery creation dialog
  showDeliveryDialog = signal<boolean>(false);

  // Carousel responsive options
  carouselResponsiveOptions: any[] = [
    {
      breakpoint: '1199px',
      numVisible: 2,
      numScroll: 1
    },
    {
      breakpoint: '991px',
      numVisible: 1,
      numScroll: 1
    },
    {
      breakpoint: '767px',
      numVisible: 1,
      numScroll: 1
    }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private messageService: MessageService,
    private purchaseOrderService: PurchaseOrderService,
    private purchaseOrderItemService: PurchaseOrderItemService,
    private purchaseOrderStatusHistoryNoteService: PurchaseOrderStatusHistoryNoteService,
    private requestService: RequestService,
    private providerService: ProviderService,
    private purchaseOrderStatusService: PurchaseOrderStatusService
  ) {}

  ngOnInit() {
    // Get the ID from the route parameters
    this.route.params.subscribe(params => {
      this.orderId = params['id'] ? +params['id'] : null;
      if (this.orderId) {
        this.loadOrderDetails();
      }
    });
  }

  async loadOrderDetails() {
    if (!this.orderId) return;
    
    this.loading.set(true);
    this.error = null;
    
    try {
      console.log('Cargando detalles de la orden para ID:', this.orderId);
      
      // Get purchase order details by ID
      const getRequest: GetRequest = { ids: [this.orderId] };
      const orderDetails = await this.purchaseOrderService.purchaseOrderGetPurchaseOrderDetailsById(getRequest).toPromise();
      
      if (orderDetails) {
        // Enrich the order with additional information
        const enrichedOrder: EnrichedPurchaseOrderDetails = { ...orderDetails };
        
        // Get provider details
        if (orderDetails.providerId) {
          try {
            const provider = await this.providerService.providerGetProviderDetailsById({ ids: [orderDetails.providerId] }).toPromise();
            enrichedOrder.providerDetails = provider || undefined;
          } catch (error) {
            console.error('Error cargando proveedor:', error);
          }
        }
        
        // Get current status (latest status from status history)
        if (orderDetails.statusHistory && orderDetails.statusHistory.length > 0) {
          const latestStatusHistory = orderDetails.statusHistory.sort((a, b) => 
            new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
          )[0];
          enrichedOrder.currentStatus = latestStatusHistory.status || undefined;
          
          // Get real operations from status details
          if (latestStatusHistory.status?.id) {
            try {
              const statusDetails = await this.purchaseOrderStatusService
                .purchaseOrderStatusGetPurchaseOrderStatusDetailsById({ ids: [latestStatusHistory.status.id] })
                .toPromise();
              
              if (statusDetails?.operations) {
                enrichedOrder.currentOperations = statusDetails.operations
                  .map(op => op.operationId)
                  .filter(id => id !== undefined) as number[];
              }
            } catch (error) {
              console.error('Error cargando detalles del estado:', error);
              // Fallback to empty operations if status details fetch fails
              enrichedOrder.currentOperations = [];
            }
          }
        }
        
        this.orderDetails.set(enrichedOrder);
        
        // Load request details to get items pending
        if (orderDetails.requestId) {
          await this.loadRequestDetails(orderDetails.requestId);
        }
      } else {
        this.error = 'Orden no encontrada';
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se encontró la orden solicitada'
        });
      }
    } catch (error) {
      console.error('Error cargando detalles de la orden:', error);
      this.error = 'Error cargando detalles de la orden';
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error cargando detalles de la orden'
      });
    } finally {
      this.loading.set(false);
    }
  }

  async loadRequestDetails(requestId: number) {
    try {
      console.log('Cargando detalles del pedido para ID:', requestId);
      
      const getRequest: GetRequest = { ids: [requestId] };
      const requestDetails = await this.requestService.requestGetRequestDetailsById(getRequest).toPromise();
      
      if (requestDetails) {
        this.requestDetails.set(requestDetails);
        //The requestDetails.itemsPending but with the requestDetails.items quantity 
        this.pendingItems.set(requestDetails.itemsPending?.map(item => {
          const itemQuantity = this.orderDetails()?.items?.find(i => i.itemId === item.itemId)?.quantity || 0;
          return {
            ...item,
            quantity: (item.quantity || 0) + itemQuantity
          };
        }) || []);
      }


    } catch (error) {
      console.error('Error cargando detalles del pedido:', error);
      // Don't show error message to user as this is supplementary data
    }
  }

  goBack() {
    this.location.back();
  }

  // Check if specific operations are available
  canAddItems(): boolean {
    const operations = this.orderDetails()?.currentOperations || [];
    const hasAddOperation = operations.includes(Operations.AddPurchaseOrderItem);
    
    // Only allow adding items if we have the operation AND there are pending items
    if (!hasAddOperation) return false;
    
    const pendingItems = this.requestDetails()?.itemsPending || [];
    return pendingItems.length > 0;
  }

  canDeleteItems(): boolean {
    const operations = this.orderDetails()?.currentOperations || [];
    return operations.includes(Operations.DeletePurchaseOrderItem);
  }

  canEditItems(): boolean {
    // For now, we'll allow editing if we can add or delete items
    return this.canAddItems() || this.canDeleteItems();
  }

  hasDeliveries(): boolean {
    return !!(this.orderDetails()?.deliveries && this.orderDetails()!.deliveries!.length > 0);
  }

  // Check if deliveries tab should be shown
  canShowDeliveriesTab(): boolean {
    const operations = this.orderDetails()?.currentOperations || [];
    const hasCreateDeliveryOperation = operations.includes(Operations.CreatePurchaseOrderDelivery);
    const hasDeleteDeliveryOperation = operations.includes(Operations.DeletePurchaseOrderDelivery);

    // Show tab if user has delivery operations OR if there are already deliveries to view
    return hasCreateDeliveryOperation || hasDeleteDeliveryOperation || this.hasDeliveries();
  }

  canShowAddDeliveryButton(): boolean {
    const operations = this.orderDetails()?.currentOperations || [];
    const hasCreateDeliveryOperation = operations.includes(Operations.CreatePurchaseOrderDelivery);
    return hasCreateDeliveryOperation;
  }

  // Delivery creation methods
  openDeliveryDialog() {
    if (!this.canShowAddDeliveryButton() || !this.orderId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'No tienes permisos para crear entregas en esta orden'
      });
      return;
    }
    
    this.showDeliveryDialog.set(true);
  }

  handleDeliveryCreated(createdDelivery: PurchaseOrderDeliveryDetailsResponseModel) {
    console.log('Entrega creada:', createdDelivery);
    
    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Entrega creada correctamente'
    });

    // Reload order details to show the new delivery
    this.loadOrderDetails();
  }

  // Note addition handler
  addNoteHandler = async (newNote: { id: number; note: string }) => {
    try {
      console.log('Agregando nota:', newNote);
      
      const noteRequest: PurchaseOrderStatusHistoryNoteRequestModel = {
        purchaseOrderHistoryId: newNote.id,
        note: newNote.note
      };
      
      const createdNote = await this.purchaseOrderStatusHistoryNoteService
        .purchaseOrderStatusHistoryNoteCreate(noteRequest)
        .toPromise();
      
      if (createdNote) {
        // Update the status history with the new note
        this.orderDetails.update(currentDetails => {
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
    if (!this.orderId) return;
    
    try {
      console.log('Agregando artículo:', item);
      
      const addItemRequest: AddItemRequestModel = {
        id: this.orderId,
        items: [item]
      };
      
      await this.purchaseOrderItemService.purchaseOrderItemAddPurchaseOrderItem(addItemRequest).toPromise();
      
      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Artículo agregado correctamente'
      });
      
      // Reload order details to show updated items
      await this.loadOrderDetails();
      
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
    if (!this.orderId) return;
    
    try {
      console.log('Editando artículo:', data);
      
      // For editing, we use the same add method with updated quantity
      const editItemRequest: AddItemRequestModel = {
        id: this.orderId,
        items: [{
          itemId: data.itemId,
          quantity: data.quantity
        }]
      };
      
      await this.purchaseOrderItemService.purchaseOrderItemAddPurchaseOrderItem(editItemRequest).toPromise();
      
      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Cantidad del artículo actualizada correctamente'
      });
      
      // Reload order details to show updated items
      await this.loadOrderDetails();
      
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
    if (!this.orderId) return;
    
    try {      
      const entityIdToDelete = data.correspondentEntityId!;
      await this.purchaseOrderItemService.purchaseOrderItemDeletePurchaseOrderItems(entityIdToDelete).toPromise();
      
      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Artículo eliminado correctamente'
      });
      
      // Reload order details to show updated items
      await this.loadOrderDetails();
      
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

  formatPhoneNumbers(): string {
    const phones = this.orderDetails()?.providerDetails?.phones;
    if (!phones || phones.length === 0) return 'N/A';
    return phones.map(phone => phone.phoneNumber).join(', ');
  }
}
