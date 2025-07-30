import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { StepperModule } from 'primeng/stepper';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { FileUploadModule } from 'primeng/fileupload';
import { ImageModule } from 'primeng/image';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';

import { PurchaseOrderDeliveryService } from '@birthstonesdevops/topaz.backend.ordersservice';
import { CreatePurchaseOrderDeliveryRequestModel } from '@birthstonesdevops/topaz.backend.ordersservice';
import { PurchaseOrderDeliveryDetailsResponseModel } from '@birthstonesdevops/topaz.backend.ordersservice';
import { ItemRequestModel } from '@birthstonesdevops/topaz.backend.ordersservice';
import { ItemDetailsResponseModel } from '@birthstonesdevops/topaz.backend.ordersservice';

import { ItemListComponent } from '../../shared/item-list/item-list.component';

@Component({
  selector: 'app-order-delivery-creation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    StepperModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    ToastModule,
    FileUploadModule,
    ImageModule,
    ProgressSpinnerModule,
    ItemListComponent
  ],
  templateUrl: './order-delivery-creation-dialog.component.html',
  styleUrl: './order-delivery-creation-dialog.component.css',
  providers: [MessageService]
})
export class OrderDeliveryCreationDialogComponent {
  @Input() visible: boolean = false;
  @Input() purchaseOrderId!: number;
  @Input() itemFilter?: ItemDetailsResponseModel[];
  
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() deliveryCreated = new EventEmitter<PurchaseOrderDeliveryDetailsResponseModel>();

  // Step management
  currentStep = signal<number>(0);
  
  // Step 1 data
  note: string = '';
  items = signal<ItemRequestModel[]>([]);
  creatingDelivery = signal<boolean>(false);
  
  // Step 2 data
  createdDelivery: PurchaseOrderDeliveryDetailsResponseModel | null = null;
  selectedFile = signal<File | null>(null);
  imagePreview: string | null = null;
  uploadingImage = signal<boolean>(false);

  // Computed properties
  canProceedToStep2 = computed(() => {
    return this.items().length > 0;
  });

  
  canCompleteStep2 = computed(() => {
    return !!this.selectedFile();
  });

  constructor(
    private deliveryService: PurchaseOrderDeliveryService,
    private messageService: MessageService
  ) {}

  // Dialog management
  show() {
    this.visible = true;
    this.visibleChange.emit(true);
  }

  hide() {
    this.visible = false;
    this.visibleChange.emit(false);
    this.resetDialog();
  }

  resetDialog() {
    this.currentStep.set(0);
    this.note = '';
    this.items.set([]);
    this.createdDelivery = null;
    this.selectedFile.set(null);
    this.imagePreview = null;
    this.creatingDelivery.set(false);
    this.uploadingImage.set(false);
  }

  // Step navigation
  nextStep() {
    if (this.currentStep() === 0 && this.canProceedToStep2()) {
      this.createDelivery();
    }
  }

  previousStep() {
    if (this.currentStep() > 0) {
      this.currentStep.set(this.currentStep() - 1);
    }
  }

  // Item list handlers
  addItemHandler = (item: ItemRequestModel) => {
    this.items.update(items => [...items, item]);
    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Artículo agregado correctamente'
    });
  };

  editItemHandler = (data: { itemId: number; correspondentEntityId?: number; quantity: number }) => {
    this.items.update(items => {
      const itemIndex = items.findIndex(item => item.itemId === data.itemId);
      if (itemIndex !== -1) {
        const updatedItems = [...items];
        updatedItems[itemIndex].quantity = data.quantity;
        return updatedItems;
      }
      return items;
    });
    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Artículo actualizado correctamente'
    });
  };

  deleteItemHandler = (data: { itemId: number; correspondentEntityId?: number }) => {
    this.items.update(items => items.filter(item => item.itemId !== data.itemId));
    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Artículo eliminado correctamente'
    });
  };

  // Step 1: Create delivery
  async createDelivery() {
    if (!this.canProceedToStep2()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Debe agregar al menos un artículo'
      });
      return;
    }

    this.creatingDelivery.set(true);
    
    try {
      const deliveryRequest: CreatePurchaseOrderDeliveryRequestModel = {
        purchaseOrderId: this.purchaseOrderId,
        note: this.note.trim() || null,
        items: this.items()
      };

      const createdDelivery = await this.deliveryService
        .purchaseOrderDeliveryCreatePurchaseOrderDelivery(deliveryRequest)
        .toPromise();

      if (createdDelivery) {
        this.createdDelivery = createdDelivery;
        this.currentStep.set(1);
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Entrega creada correctamente'
        });
      }
    } catch (error) {
      console.error('Error creating delivery:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error creando la entrega'
      });
    } finally {
      this.creatingDelivery.set(false);
    }
  }

  // Step 2: Image upload
  onFileSelect(event: any) {
    const file = event.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Solo se permiten archivos de imagen'
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5000000) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'El archivo no puede ser mayor a 5MB'
        });
        return;
      }

      this.selectedFile.set(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  clearSelectedFile() {
    this.selectedFile.set(null);
    this.imagePreview = null;
  }

  async uploadImage() {
    if (!this.selectedFile() || !this.createdDelivery?.id) {
      return;
    }

    const fileToUpload = this.selectedFile()!; // We know it's not null due to the check above
    this.uploadingImage.set(true);

    try {
      const updatedPurchaseOrder = await this.deliveryService
        .purchaseOrderDeliveryUploadPurchaseOrderDeliveryImage(
          this.createdDelivery.id,
          fileToUpload
        )
        .toPromise();

      if (updatedPurchaseOrder) {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Imagen subida correctamente'
        });

        // Emit the created delivery and close dialog
        this.deliveryCreated.emit(this.createdDelivery);
        this.hide();
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error subiendo la imagen'
      });
    } finally {
      this.uploadingImage.set(false);
    }
  }

  // Skip image upload and complete
  skipImageUpload() {
    if (this.createdDelivery) {
      this.deliveryCreated.emit(this.createdDelivery);
      this.hide();
    }
  }

  // Convert items for ItemListComponent
  itemsForDisplay = computed<ItemDetailsResponseModel[]>(() => {
    return this.items().map(item => ({
      itemId: item.itemId,
      quantity: item.quantity,
      correspondentEntityId: undefined,
      createdAt: undefined,
      updatedAt: undefined
    }));
  });
}
