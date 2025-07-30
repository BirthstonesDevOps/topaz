import { Component, OnInit, OnChanges, SimpleChanges, Output, EventEmitter, Input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { StepperModule } from 'primeng/stepper';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { FluidModule } from 'primeng/fluid';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';

import { ProviderService, ProviderResponseModel } from '@birthstonesdevops/topaz.backend.organizationservice';
import { 
  CreatePurchaseOrderRequestModel,
  PurchaseOrderRequestModel,
  ItemRequestModel, 
  NoteRequestModel,
  ItemDetailsResponseModel
} from '@birthstonesdevops/topaz.backend.ordersservice';

import { ItemListComponent } from '../../shared/item-list/item-list.component';

interface StepData {
  providerId: number | null;
  orderNumber: string;
  items: ItemDetailsResponseModel[];
  notes: NoteRequestModel[];
}

@Component({
  selector: 'app-order-creation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    StepperModule,
    ButtonModule,
    ProgressSpinnerModule,
    SelectModule,
    InputTextModule,
    TextareaModule,
    FluidModule,
    ToastModule,
    TagModule,
    DividerModule,
    ItemListComponent
  ],
  templateUrl: './order-creation-dialog.component.html',
  styleUrl: './order-creation-dialog.component.css',
  providers: [MessageService]
})
export class OrderCreationDialogComponent implements OnInit, OnChanges {
  @Input() visible: boolean = false;
  @Input() requestId!: number;
  @Input() itemFilter?: ItemDetailsResponseModel[];
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() orderCreated = new EventEmitter<CreatePurchaseOrderRequestModel>();

  // Loading states
  loading = signal<boolean>(false);
  dataLoaded = signal<boolean>(false);

  // Data arrays
  providers = signal<ProviderResponseModel[]>([]);

  // Stepper state
  currentStep = signal<number>(1);

  // Form data
  stepData = signal<StepData>({
    providerId: null,
    orderNumber: '',
    items: [],
    notes: []
  });

  // New note input
  newNote: string = '';

  // Computed properties
  selectedProvider = computed(() => {
    const data = this.stepData();
    if (!data.providerId) return null;
    return this.providers().find(provider => provider.id === data.providerId) || null;
  });

  step1Valid = computed(() => {
    const data = this.stepData();
    return !!(data.providerId && data.orderNumber.trim());
  });

  step2Valid = computed(() => {
    const data = this.stepData();
    return data.items.length > 0;
  });

  constructor(
    private providerService: ProviderService,
    private messageService: MessageService
  ) {}

  // Update methods for form binding
  updateProviderId(providerId: number | null) {
    this.stepData.update(data => ({ ...data, providerId }));
  }

  updateOrderNumber(orderNumber: string) {
    this.stepData.update(data => ({ ...data, orderNumber }));
  }

  ngOnInit() {
    this.loadInitialData();
  }

  ngOnChanges(changes: SimpleChanges) {
    // Reset form when dialog becomes visible
    if (changes['visible'] && 
        changes['visible'].currentValue === true && 
        changes['visible'].previousValue === false) {
      this.resetForm();
    }
  }

  async loadInitialData() {
    this.loading.set(true);
    this.dataLoaded.set(false);

    try {
      const providersResponse = await this.providerService.providerGetAll().toPromise();
      this.providers.set(providersResponse || []);
      this.dataLoaded.set(true);
    } catch (error) {
      console.error('Error loading initial data:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error cargando proveedores'
      });
    } finally {
      this.loading.set(false);
    }
  }

  // Dialog methods
  show() {
    this.visible = true;
    this.visibleChange.emit(true);
  }

  hide() {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  resetForm() {
    this.currentStep.set(1);
    
    this.stepData.set({
      providerId: null,
      orderNumber: '',
      items: [],
      notes: []
    });
    this.newNote = '';
  }

  // Step navigation
  nextStep() {
    if (this.currentStep() < 3) {
      this.currentStep.set(this.currentStep() + 1);
    }
  }

  previousStep() {
    if (this.currentStep() > 1) {
      this.currentStep.set(this.currentStep() - 1);
    }
  }

  goToStep(step: number) {
    if (step <= 3) {
      this.currentStep.set(step);
    }
  }

  // Item list handlers
  addItemHandler = (item: ItemRequestModel) => {
    this.stepData.update(data => {
      // Check if item already exists
      const existingItemIndex = data.items.findIndex((existingItem: any) => existingItem.itemId === item.itemId);
      
      if (existingItemIndex !== -1) {
        // Item exists, sum the quantities
        const updatedItems = [...data.items];
        const existingItem = updatedItems[existingItemIndex];
        const currentQuantity = existingItem.quantity || 0;
        updatedItems[existingItemIndex] = {
          ...existingItem,
          quantity: currentQuantity + item.quantity,
          updatedAt: new Date().toISOString()
        };
        return { ...data, items: updatedItems };
      } else {
        // Item doesn't exist, add as new
        const itemDetails: ItemDetailsResponseModel = {
          itemId: item.itemId,
          quantity: item.quantity,
          createdAt: new Date().toISOString(),
          updatedAt: null
        };
        return { ...data, items: [...data.items, itemDetails] };
      }
    });
    
    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Artículo agregado correctamente'
    });
  };

  editItemHandler = (data: { itemId: number; correspondentEntityId?: number; quantity: number }) => {
    this.stepData.update(stepData => {
      const index = stepData.items.findIndex((item: any) => item.itemId === data.itemId);
      if (index !== -1) {
        const updatedItems = [...stepData.items];
        updatedItems[index] = { ...updatedItems[index], quantity: data.quantity };
        return { ...stepData, items: updatedItems };
      }
      return stepData;
    });
    
    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Artículo actualizado correctamente'
    });
  };

  deleteItemHandler = (data: { itemId: number; correspondentEntityId?: number }) => {
    this.stepData.update(stepData => ({
      ...stepData,
      items: stepData.items.filter((item: any) => item.itemId !== data.itemId)
    }));
    
    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Artículo eliminado correctamente'
    });
  };

  // Notes management
  addNote() {
    if (this.newNote.trim()) {
      this.stepData.update(data => ({
        ...data,
        notes: [...data.notes, { note: this.newNote.trim() }]
      }));
      this.newNote = '';
    }
  }

  removeNote(index: number) {
    this.stepData.update(data => ({
      ...data,
      notes: data.notes.filter((_, i) => i !== index)
    }));
  }

  // Final submission
  createOrder() {
    if (!this.step1Valid() || !this.step2Valid()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Por favor complete todos los campos requeridos'
      });
      return;
    }

    const data = this.stepData();
    const order: CreatePurchaseOrderRequestModel = {
      orderNumber: data.orderNumber.trim(),
      requestId: this.requestId,
      providerId: data.providerId!,
      items: data.items.map((item: any) => ({
        itemId: item.itemId!,
        quantity: item.quantity!
      })),
      notes: data.notes.length > 0 ? data.notes : undefined
    };

    this.orderCreated.emit(order);
    this.hide();
  }

  // Utility methods
  canProceedToStep2(): boolean {
    return this.step1Valid();
  }

  canProceedToStep3(): boolean {
    return this.canProceedToStep2() && this.step2Valid();
  }

  shouldShowSubmitButton(): boolean {
    return this.currentStep() === 3;
  }

  shouldShowNextButton(): boolean {
    return this.currentStep() < 3;
  }
}
