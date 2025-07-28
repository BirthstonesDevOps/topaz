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
import { DatePickerModule } from 'primeng/datepicker';


import { LocationService, AreaService } from '@birthstonesdevops/topaz.backend.organizationservice';
import { LocationResponseModel, AreaResponseModel } from '@birthstonesdevops/topaz.backend.organizationservice';
import { CreateRequestRequestModel, ItemRequestModel, NoteRequestModel } from '@birthstonesdevops/topaz.backend.ordersservice';
import { ItemDetailsResponseModel } from '@birthstonesdevops/topaz.backend.ordersservice';

import { ItemListComponent } from '../../shared/item-list/item-list.component';

interface StepData {
  areaId: number | null;
  locationId: number | null;
  neededAt: Date | null;
  items: ItemDetailsResponseModel[];
  notes: NoteRequestModel[];
}

@Component({
  selector: 'app-request-creation-dialog',
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
    DatePickerModule,
    ItemListComponent
  ],
  templateUrl: './request-creation-dialog.component.html',
  styleUrl: './request-creation-dialog.component.css',
  providers: [MessageService]
})
export class RequestCreationDialogComponent implements OnInit, OnChanges {
  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() requestCreated = new EventEmitter<CreateRequestRequestModel>();

  // Loading states
  loading = signal<boolean>(false);
  dataLoaded = signal<boolean>(false);

  // Data arrays
  areas = signal<AreaResponseModel[]>([]);
  locations = signal<LocationResponseModel[]>([]);

  // Stepper state
  currentStep = signal<number>(1);

  // Date constraints
  tomorrowDate: Date | null = null;
  

  // Form data
  stepData = signal<StepData>({
    areaId: null,
    locationId: null,
    neededAt: null,
    items: [],
    notes: []
  });

  // New note input
  newNote: string = '';

  // Computed properties
    selectedArea = computed(() => {
    const data = this.stepData();
    if (!data.areaId) return null;
    return this.areas().find(area => area.id === data.areaId) || null;
  });

  selectedLocation = computed(() => {
    const data = this.stepData();
    if (!data.locationId) return null;
    return this.locations().find(location => location.id === data.locationId) || null;
  });

  step1Valid = computed(() => {
    const data = this.stepData();
    return !!(data.areaId && data.locationId && data.neededAt);
  });

  step2Valid = computed(() => {
    const data = this.stepData();
    return data.items.length > 0;
  });

  constructor(
    private locationService: LocationService,
    private areaService: AreaService,
    private messageService: MessageService
  ) {}

  // Update methods for form binding
  updateAreaId(areaId: number | null) {
    this.stepData.update(data => ({ ...data, areaId }));
  }

  updateLocationId(locationId: number | null) {
    this.stepData.update(data => ({ ...data, locationId }));
  }

  updateNeededAt(neededAt: Date | null) {
    this.stepData.update(data => ({ ...data, neededAt }));
  }

  ngOnInit() {
    this.loadInitialData();
    this.tomorrowDate = new Date();
    this.tomorrowDate.setDate(this.tomorrowDate.getDate() + 1);
  }

  ngOnChanges(changes: SimpleChanges) {
    // Reset form when dialog becomes visible (but not on initial component creation)
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
      const [areasResponse, locationsResponse] = await Promise.all([
        this.areaService.areaGetAll().toPromise(),
        this.locationService.locationGetAll().toPromise()
      ]);

      this.areas.set(areasResponse || []);
      this.locations.set(locationsResponse || []);
      this.dataLoaded.set(true);
    } catch (error) {
      console.error('Error loading initial data:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error cargando datos iniciales'
      });
    } finally {
      this.loading.set(false);
    }
  }

  // Dialog methods
  show() {
    this.visible = true;
    this.visibleChange.emit(true);
    // resetForm() is now called in ngOnChanges when visible becomes true
  }

  hide() {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  resetForm() {
    this.currentStep.set(1);
    
    this.stepData.set({
      areaId: null,
      locationId: null,
      neededAt: null,
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
    this.currentStep.set(step);
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

  editItemHandler = (data: { id: number; quantity: number }) => {
    this.stepData.update(stepData => {
      const index = stepData.items.findIndex((item: any) => item.itemId === data.id);
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

  deleteItemHandler = (itemId: number) => {
    this.stepData.update(data => ({
      ...data,
      items: data.items.filter((item: any) => item.itemId !== itemId)
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
  createRequest() {
    if (!this.step1Valid() || !this.step2Valid()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Por favor complete todos los campos requeridos'
      });
      return;
    }

    const data = this.stepData();
    const request: CreateRequestRequestModel = {
      areaId: data.areaId!,
      locationId: data.locationId!,
      neededAt: data.neededAt!.toISOString(),
      items: data.items.map((item: any) => ({
        itemId: item.itemId!,
        quantity: item.quantity!
      })),
      notes: data.notes.length > 0 ? data.notes : undefined
    };

    this.requestCreated.emit(request);
    this.hide();
  }

  // Utility methods
  getStepStatus(step: number): string {
    if (step < this.currentStep()) return 'completed';
    if (step === this.currentStep()) return 'active';
    return 'inactive';
  }

  canProceedToStep2(): boolean {
    return !!this.step1Valid();
  }

  canProceedToStep3(): boolean {
    return this.canProceedToStep2() && !!this.step2Valid();
  }
}
