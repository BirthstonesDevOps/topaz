import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ImageModule } from 'primeng/image';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { PurchaseOrderDeliveryDetailsResponseModel } from '@birthstonesdevops/topaz.backend.ordersservice';
import { ItemListComponent } from '../../shared/item-list/item-list.component';

@Component({
  selector: 'app-order-delivery-details',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ImageModule,
    TagModule,
    DividerModule,
    ItemListComponent
  ],
  templateUrl: './order-delivery-details.component.html',
  styleUrl: './order-delivery-details.component.css'
})
export class OrderDeliveryDetailsComponent {
  @Input() deliveryDetails: PurchaseOrderDeliveryDetailsResponseModel | null = null;

  get hasImage(): boolean {
    return !!(this.deliveryDetails?.imageURL);
  }

  get hasNote(): boolean {
    return !!(this.deliveryDetails?.note?.trim());
  }

  get hasItems(): boolean {
    return !!(this.deliveryDetails?.items && this.deliveryDetails.items.length > 0);
  }

  get formattedCreatedDate(): string {
    if (!this.deliveryDetails?.createdAt) return '';
    return new Date(this.deliveryDetails.createdAt).toLocaleDateString();
  }

  get formattedUpdatedDate(): string {
    if (!this.deliveryDetails?.updatedAt) return '';
    return new Date(this.deliveryDetails.updatedAt).toLocaleDateString();
  }
}
