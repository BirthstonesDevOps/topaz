import { Component, OnInit, Output, EventEmitter, Input, signal, computed } from '@angular/core';
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
export class RequestCreationDialogComponent implements OnInit {
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
  stepData: StepData = {
    areaId: null,
    locationId: null,
    neededAt: null,
    items: [],
    notes: []
  };

  // New note input
  newNote: string = '';

  // Computed properties
  selectedArea = computed(() => {
    if (!this.stepData.areaId) return null;
    return this.areas().find(area => area.id === this.stepData.areaId) || null;
  });

  selectedLocation = computed(() => {
    if (!this.stepData.locationId) return null;
    return this.locations().find(location => location.id === this.stepData.locationId) || null;
  });

  step1Valid = computed(() => {
    return this.stepData.areaId && this.stepData.locationId && this.stepData.neededAt;
  });

  step2Valid = computed(() => {
      return true;
    });

  constructor(
    private locationService: LocationService,
    private areaService: AreaService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.loadInitialData();
    this.tomorrowDate = new Date();
    this.tomorrowDate.setDate(this.tomorrowDate.getDate() + 1);
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
    this.resetForm();
  }

  hide() {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  resetForm() {
    this.currentStep.set(1);
    
    this.stepData = {
      areaId: null,
      locationId: null,
      neededAt: null,
      items: [],
      notes: []
    };
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
    // Create a mock ItemDetailsResponseModel for display
    const itemDetails: ItemDetailsResponseModel = {
      itemId: item.itemId,
      quantity: item.quantity,
      createdAt: new Date().toISOString(),
      updatedAt: null
    };
    
    // Create new array to trigger change detection
    this.stepData.items = [...this.stepData.items, itemDetails];
    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Artículo agregado correctamente'
    });
  };

  editItemHandler = (data: { id: number; quantity: number }) => {
    const index = this.stepData.items.findIndex(item => item.itemId === data.id);
    if (index !== -1) {
      // Create new array with updated item
      const updatedItems = [...this.stepData.items];
      updatedItems[index] = { ...updatedItems[index], quantity: data.quantity };
      this.stepData.items = updatedItems;
      
      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Artículo actualizado correctamente'
      });
    }
  };

  deleteItemHandler = (itemId: number) => {
    const index = this.stepData.items.findIndex(item => item.itemId === itemId);
    if (index !== -1) {
      // Create new array without the deleted item
      this.stepData.items = this.stepData.items.filter(item => item.itemId !== itemId);
      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Artículo eliminado correctamente'
      });
    }
  };

  // Notes management
  addNote() {
    if (this.newNote.trim()) {
      this.stepData.notes.push({ note: this.newNote.trim() });
      this.newNote = '';
    }
  }

  removeNote(index: number) {
    this.stepData.notes.splice(index, 1);
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

    const request: CreateRequestRequestModel = {
      areaId: this.stepData.areaId!,
      locationId: this.stepData.locationId!,
      neededAt: this.stepData.neededAt!.toISOString(),
      items: this.stepData.items.map(item => ({
        itemId: item.itemId!,
        quantity: item.quantity!
      })),
      notes: this.stepData.notes.length > 0 ? this.stepData.notes : undefined
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
