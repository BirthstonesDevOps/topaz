import { Component, Input, Output, EventEmitter, OnInit, signal, OnChanges, SimpleChanges, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
import { ToolbarModule } from 'primeng/toolbar';
import { IconFieldModule } from 'primeng/iconfield';

import { 
  PurchaseOrderDetailsResponseModel, 
  PurchaseOrderService,
  PurchaseOrderRequestModel,
  ChangeStatusRequestModel,
  CreatePurchaseOrderRequestModel,
  PurchaseOrderUpdateRequestModel,
  UpdateRequestOfPurchaseOrderUpdateRequestModel,
  StatusDetailsResponseModel,
  ItemDetailsResponseModel,
  RequestDetailsResponseModel
} from '@birthstonesdevops/topaz.backend.ordersservice';
import { 
  ProviderService,
  ProviderResponseModel,
  GetRequest
} from '@birthstonesdevops/topaz.backend.organizationservice';
import { OrderCreationDialogComponent } from './order-creation-dialog/order-creation-dialog.component';

// Extended order interface for table display
interface OrderTableData extends PurchaseOrderDetailsResponseModel {
  providerName?: string;
  currentStatus?: StatusDetailsResponseModel;
}

@Component({
  selector: 'app-orders',
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
    OrderCreationDialogComponent,
    ToolbarModule,
    IconFieldModule
  ],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css',
  providers: [MessageService, ConfirmationService]
})
export class OrdersComponent implements OnInit, OnChanges {
  @Input() ordersInput?: PurchaseOrderDetailsResponseModel[];
  @Input() requestId: number | undefined;
  @Input() itemFilter?: ItemDetailsResponseModel[];
  
  @Output() orderUpdated = new EventEmitter<RequestDetailsResponseModel>();
  @Output() orderChanged = new EventEmitter<number>(); // Emits request ID for reload
  
  showCreateDialog: boolean = false;
  showEditDialog: boolean = false;
  editOrderData: OrderTableData | null = null;
  
  // Loading state
  loading = signal<boolean>(false);
  
  // Orders data
  allOrders = signal<OrderTableData[]>([]);
  
  // Search functionality
  searchTerm = signal<string>('');
  
  // Delete confirmation dialog
  showDeleteDialog: boolean = false;
  deleteOrderId: number | null = null;
  deleteNotes: string = '';
  deletingOrder = signal<boolean>(false);
  
  // Computed filtered orders
  orders = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.allOrders();
    
    return this.allOrders().filter(order => 
      order.providerName?.toLowerCase().includes(term) ||
      order.orderNumber?.toLowerCase().includes(term) ||
      order.currentStatus?.status?.toLowerCase().includes(term) ||
      order.id?.toString().includes(term)
    );
  });

  constructor(
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private purchaseOrderService: PurchaseOrderService,
    private providerService: ProviderService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['ordersInput'] && changes['ordersInput'].currentValue) {
      // Use provided input orders and enrich them
      this.enrichOrders(this.ordersInput!);
    } else if (changes['ordersInput'] && !changes['ordersInput'].currentValue && !this.ordersInput) {
      // No input provided, load from API
      this.loadOrders();
    }
  }

  async loadOrders() {
    if (this.ordersInput) {
      // Use input orders if provided and enrich them
      await this.enrichOrders(this.ordersInput);
      return;
    }

    // Load from API if no input provided
    this.loading.set(true);
    try {
      const ordersResponse = await this.purchaseOrderService.purchaseOrderGetAllPurchaseOrderDetails().toPromise();
      if (ordersResponse) {
        await this.enrichOrders(ordersResponse);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error cargando órdenes de compra'
      });
    } finally {
      this.loading.set(false);
    }
  }

  async enrichOrders(orders: PurchaseOrderDetailsResponseModel[]) {
    this.loading.set(true);
    try {
      // Enrich orders with provider names and current status
      const enrichedOrders = await Promise.all(
        orders.map(async (order) => {
          const enrichedOrder: OrderTableData = { ...order };
          
          // Get provider name
          if (order.providerId) {
            try {
              const provider = await this.providerService.providerGetById({ ids: [order.providerId] }).toPromise();
              enrichedOrder.providerName = provider?.name || 'N/A';
            } catch (error) {
              enrichedOrder.providerName = 'Error';
            }
          }
          
          // Get current status (latest status from status history)
          if (order.statusHistory && order.statusHistory.length > 0) {
            const latestStatusHistory = order.statusHistory.sort((a, b) => 
              new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
            )[0];
            enrichedOrder.currentStatus = latestStatusHistory.status || undefined;
          }
          
          return enrichedOrder;
        })
      );
      
      this.allOrders.set(enrichedOrders);
    } catch (error) {
      console.error('Error enriching orders:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error procesando órdenes de compra'
      });
    } finally {
      this.loading.set(false);
    }
  }

  openCreateDialog() {
    if (!this.requestId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Se requiere un ID de solicitud para crear una orden'
      });
      return;
    }
    this.showCreateDialog = true;
  }

  async handleOrderCreated(order: CreatePurchaseOrderRequestModel) {
    try {
      // Create the order using the service
      const createdRequestDetails = await this.purchaseOrderService.purchaseOrderCreatePurchaseOrder(order).toPromise();
      
      if (createdRequestDetails && createdRequestDetails.purchaseOrders) {
        // Update orders with the new list from the response
        await this.enrichOrders(createdRequestDetails.purchaseOrders);
        
        // Update item filter with the itemsPending from the response
        this.itemFilter = createdRequestDetails.itemsPending;
        
        // Emit the updated request details to parent component
        this.orderUpdated.emit(createdRequestDetails);
        
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Orden de compra creada correctamente'
        });
      }
    } catch (error) {
      console.error('Error creating order:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error creando la orden de compra'
      });
    }

    this.showCreateDialog = false;
  }

  // Delete functionality
  confirmDelete(orderId: number) {
    this.deleteOrderId = orderId;
    this.deleteNotes = '';
    this.showDeleteDialog = true;
  }

  cancelDelete() {
    this.showDeleteDialog = false;
    this.deleteOrderId = null;
    this.deleteNotes = '';
  }

  async executeDelete() {
    if (!this.deleteOrderId) return;

    this.deletingOrder.set(true);
    
    try {
      const deleteRequest: ChangeStatusRequestModel = {
        id: this.deleteOrderId,
        notes: this.deleteNotes.trim() ? [{ note: this.deleteNotes.trim() }] : undefined
      };

      await this.purchaseOrderService.purchaseOrderDeletePurchaseOrder(deleteRequest).toPromise();
      
      // Reload orders to get updated list
      await this.loadOrders();
      
      // Emit request ID to trigger parent reload since delete doesn't return full request details
      if (this.requestId) {
        this.orderChanged.emit(this.requestId);
      }
      
      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Orden de compra eliminada correctamente'
      });
      
      this.cancelDelete();
    } catch (error) {
      console.error('Error deleting order:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error eliminando la orden de compra'
      });
    } finally {
      this.deletingOrder.set(false);
    }
  }

  // Edit functionality
  editOrder(orderId: number) {
    console.log('Edit order:', orderId);
    // Find the order data
    const orderToEdit = this.allOrders().find(order => order.id === orderId);
    if (orderToEdit) {
      this.editOrderData = orderToEdit;
      this.showEditDialog = true;
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se encontró la orden de compra a editar'
      });
    }
  }

  async handleOrderUpdated(updateData: { id: number; updateData: PurchaseOrderUpdateRequestModel }) {
    try {
      console.log('Updating order:', updateData);
      
      const updateRequest: UpdateRequestOfPurchaseOrderUpdateRequestModel = {
        ids: [new Number(updateData.id)],
        model: updateData.updateData
      };
      
      const updatedOrder = await this.purchaseOrderService.purchaseOrderUpdate(updateRequest).toPromise();
      
      if (updatedOrder) {
        // Reload all orders to get the updated list
        await this.loadOrders();
        
        // Emit request ID to trigger parent reload since update doesn't return full request details
        if (this.requestId) {
          this.orderChanged.emit(this.requestId);
        }
        
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Orden de compra actualizada correctamente'
        });
      }
    } catch (error) {
      console.error('Error updating order:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error actualizando la orden de compra'
      });
    }

    this.showEditDialog = false;
    this.editOrderData = null;
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



  // Operation availability checks (for future implementation)
  canDeleteOrder(order: OrderTableData): boolean {
    // Placeholder - implement based on your business logic
    return true;
  }

  canEditOrder(order: OrderTableData): boolean {
    // Placeholder - implement based on your business logic
    return true;
  }

  // Navigation to order details
  navigateToOrderDetails(orderId: number) {
    this.router.navigate(['/orders', orderId]);
  }
}
