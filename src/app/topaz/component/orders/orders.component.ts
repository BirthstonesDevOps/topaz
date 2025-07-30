import { Component, Input, OnInit, signal, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PurchaseOrderDetailsResponseModel, PurchaseOrderService } from '@birthstonesdevops/topaz.backend.ordersservice';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Button } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-orders',
  imports: [CommonModule, FormsModule, ToastModule, ProgressSpinnerModule, Button, ToolbarModule, IconField, InputIcon],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css',
  providers: [MessageService]
})
export class OrdersComponent implements OnInit, OnChanges {
  @Input() ordersInput?: PurchaseOrderDetailsResponseModel[];
  @Input() requestId: number | undefined;
  
  orders = signal<PurchaseOrderDetailsResponseModel[]>([]);
  loading = signal<boolean>(true);
  searchTerm: any;

  constructor(
    private messageService: MessageService,
    private purchaseOrderService: PurchaseOrderService
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['ordersInput'] && changes['ordersInput'].currentValue) {
      // Use provided input orders
      this.orders.set(this.ordersInput!);
      this.loading.set(false);
    } else if (changes['ordersInput'] && !changes['ordersInput'].currentValue && !this.ordersInput) {
      // No input provided, load from API
      this.loadOrders();
    }
  }

  async loadOrders() {
    if (this.ordersInput) {
      // Use input orders if provided
      this.orders.set(this.ordersInput);
      this.loading.set(false);
      return;
    }

    // Load from API if no input provided
    this.loading.set(true);
    try {
      const ordersResponse = await this.purchaseOrderService.purchaseOrderGetAllPurchaseOrderDetails().toPromise();
      this.orders.set(ordersResponse || []);
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

  openCreateDialog() {
    throw new Error('Method not implemented.');
  }

  filterRequests() {
    throw new Error('Method not implemented.');
  }
}
