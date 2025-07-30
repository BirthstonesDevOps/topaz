/**
 * ItemListComponent - A comprehensive component for managing item lists in orders
 * 
 * Usage Example:
 * <app-item-list
 *   [items]="orderItems"
 *   [showMeasurement]="true"
 *   [showDescription]="false"
 *   [onItemSave]="addItemHandler"
 *   [onItemEdit]="editItemHandler"
 *   [onItemDelete]="deleteItemHandler">
 * </app-item-list>
 * 
 * Component handlers:
 * addItemHandler = (item: ItemRequestModel) => { console.log('Add:', item); };
 * editItemHandler = (data: { itemId: number; correspondentEntityId?: number; quantity: number }) => { console.log('Edit:', data); };
 * deleteItemHandler = (data: { itemId: number; correspondentEntityId?: number }) => { console.log('Delete:', data); };
 * 
 * Where orderItems is of type: ItemDetailsResponseModel[] (from orders service)
 */

import { Component, Input, OnInit, OnChanges, SimpleChanges, ViewChild, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { TagModule } from 'primeng/tag';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';

import { ItemService } from '@birthstonesdevops/topaz.backend.itemsservice';
import { ItemDetailsResponseModel as OrderItemDetailsResponseModel } from '@birthstonesdevops/topaz.backend.ordersservice';
import { 
  ItemResponseModel, 
  ItemDetailsResponseModel as ItemServiceItemDetailsResponseModel,
  GetRequest 
} from '@birthstonesdevops/topaz.backend.itemsservice';
import { ItemRequestModel } from '@birthstonesdevops/topaz.backend.ordersservice';

interface EnhancedItemDetails {
  orderItem: OrderItemDetailsResponseModel;
  itemDetails: ItemResponseModel | null;
  loading: boolean;
}

interface Column {
  field: string;
  header: string;
}

interface FilterItemData extends ItemServiceItemDetailsResponseModel {
  maxQuantity: number;
  isAlreadyAdded?: boolean;
}

@Component({
  selector: 'app-item-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    RippleModule,
    ToastModule,
    ToolbarModule,
    InputTextModule,
    DialogModule,
    InputIconModule,
    IconFieldModule,
    ConfirmDialogModule,
    ProgressSpinnerModule,
    SelectModule,
    InputNumberModule,
    TagModule,
    CheckboxModule,
    TooltipModule
  ],
  templateUrl: './item-list.component.html',
  styleUrl: './item-list.component.css',
  providers: [MessageService, ConfirmationService]
})
export class ItemListComponent implements OnInit, OnChanges {
  @Input() items: OrderItemDetailsResponseModel[] = [];
  @Input() itemFilter?: OrderItemDetailsResponseModel[];
  @Input() forcedFilter: boolean = false;
  @Input() showMeasurement: boolean = false;
  @Input() showDescription: boolean = false;
  @Input() onItemSave?: (item: ItemRequestModel) => void;
  @Input() onItemDelete?: (data: { itemId: number; correspondentEntityId?: number }) => void;
  @Input() onItemEdit?: (data: { itemId: number; correspondentEntityId?: number; quantity: number }) => void;

  @ViewChild('dt') dt!: Table;

  enhancedItems = signal<EnhancedItemDetails[]>([]);
  loading = signal<boolean>(false);
  globalFilter = signal<string>('');
  
  // Dialog states
  itemDialog = signal<boolean>(false);
  editItemDialog = signal<boolean>(false);
  submitted = signal<boolean>(false);
  
  // Form data
  availableItems = signal<FilterItemData[]>([]);
  selectedItemForAdd: FilterItemData | null = null;
  quantityForAdd: number = 1;
  editingItem: EnhancedItemDetails | null = null;
  quantityForEdit: number = 1;
  
  // Loading states
  loadingAvailableItems = signal<boolean>(false);
  
  cols: Column[] = [];
  
  // Computed filtered items
  filteredItems = computed(() => {
    const filter = this.globalFilter().toLowerCase();
    if (!filter) return this.enhancedItems();
    
    return this.enhancedItems().filter(item => {
      const itemDetails = item.itemDetails;
      if (!itemDetails) return false;
      
      return (
        itemDetails.name?.toLowerCase().includes(filter) ||
        itemDetails.code?.toLowerCase().includes(filter)
      );
    });
  });

  // Computed maximum quantities
  maxQuantityForAdd = computed(() => {
    // If forcedFilter is true and filter is empty, no items are available
    if (this.forcedFilter && (!this.itemFilter || this.itemFilter.length === 0)) {
      return 0;
    }
    if (!this.selectedItemForAdd) return 999999;
    // If item is already added, quantity should be 0
    if (this.selectedItemForAdd.isAlreadyAdded) return 0;
    return this.selectedItemForAdd.maxQuantity;
  });

  maxQuantityForEdit = computed(() => {
    // If forcedFilter is true and filter is empty, maximum quantity is 0
    if (this.forcedFilter && (!this.itemFilter || this.itemFilter.length === 0)) {
      return 0;
    }
    if (!this.editingItem?.orderItem.itemId) return 999999;
    
    // Find the filter item for this specific item in availableItems
    const filterItem = this.availableItems().find(item => item.id === this.editingItem?.orderItem.itemId);
    return filterItem?.maxQuantity || 999999;
  });

  constructor(
    private itemService: ItemService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.initializeColumns();
    this.loadItemDetails();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['items'] && !changes['items'].firstChange) {
      this.loadItemDetails();
    }
    if ((changes['itemFilter'] && !changes['itemFilter'].firstChange) || 
        (changes['forcedFilter'] && !changes['forcedFilter'].firstChange)) {
      // Clear available items when filter or forcedFilter changes, they'll be reloaded when dialog opens
      this.availableItems.set([]);
    }
  }

  initializeColumns() {
    this.cols = [
      { field: 'code', header: 'Código' },
      { field: 'name', header: 'Nombre' }
    ];
    
    if (this.showMeasurement) {
      this.cols.push({ field: 'measurement', header: 'Medida' });
    }
    
    if (this.showDescription) {
      this.cols.push({ field: 'description', header: 'Descripción' });
    }
    
    this.cols.push({ field: 'quantity', header: 'Cantidad' });
  }

  async loadItemDetails() {
    if (this.items.length === 0) {
      this.enhancedItems.set([]);
      return;
    }

    this.loading.set(true);
    
    const enhanced: EnhancedItemDetails[] = this.items.map(orderItem => ({
      orderItem,
      itemDetails: null,
      loading: true
    }));
    
    this.enhancedItems.set(enhanced);

    // Load item details for each item
    for (let i = 0; i < enhanced.length; i++) {
      const orderItem = enhanced[i].orderItem;
      if (orderItem.itemId) {
        try {
          const getRequest: GetRequest = { ids: [orderItem.itemId] };
          const itemDetails = await this.itemService.itemGetById(getRequest).toPromise();
          enhanced[i].itemDetails = itemDetails || null;
        } catch (error) {
          console.error(`Error loading item details for item ${orderItem.itemId}:`, error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Error cargando detalles del artículo ${orderItem.itemId}`
          });
        }
      }
      enhanced[i].loading = false;
    }
    
    this.enhancedItems.set([...enhanced]);
    this.loading.set(false);
  }

  onGlobalFilter(table: Table, event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.globalFilter.set(filterValue);
    table.filterGlobal(filterValue, 'contains');
  }

  async openNew() {
    if (!this.onItemSave) return;
    
    // Check if forcedFilter is true and no filter is provided
    if (this.forcedFilter && (!this.itemFilter || this.itemFilter.length === 0)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'No hay artículos disponibles para agregar'
      });
      return;
    }
    
    this.selectedItemForAdd = null;
    this.quantityForAdd = 1;
    this.submitted.set(false);
    this.itemDialog.set(true);
    
    // Load available items
    await this.loadAvailableItems();
  }

  async loadAvailableItems() {
    this.loadingAvailableItems.set(true);
    try {
      let filteredItems: FilterItemData[] = [];
      
      if (this.itemFilter && this.itemFilter.length > 0) {
        // If filter is provided, only load those specific items
        for (const filterItem of this.itemFilter) {
          if (filterItem.itemId) {
            try {
              const getRequest: GetRequest = { ids: [filterItem.itemId] };
              const itemDetails = await this.itemService.itemGetById(getRequest).toPromise();
              if (itemDetails) {
                // Check if this item is already in the current items list
                const isAlreadyAdded = this.items.some(existingItem => existingItem.itemId === itemDetails.id);
                
                filteredItems.push({
                  ...itemDetails,
                  maxQuantity: filterItem.quantity || 1,
                  isAlreadyAdded: isAlreadyAdded
                });
              }
            } catch (error) {
              console.error(`Error loading filtered item ${filterItem.itemId}:`, error);
            }
          }
        }
      } else if (this.forcedFilter) {
        // If forcedFilter is true and no filter is provided, no items should be available
        filteredItems = [];
      } else {
        // If no filter and forcedFilter is false, load all items with unlimited quantity
        const allItems = await this.itemService.itemGetAllItemsDetails().toPromise();
        filteredItems = (allItems || []).map(item => {
          // Check if this item is already in the current items list
          const isAlreadyAdded = this.items.some(existingItem => existingItem.itemId === item.id);
          
          return {
            ...item,
            maxQuantity: 999999, // No limit when no filter is applied
            isAlreadyAdded: isAlreadyAdded
          };
        });
      }
      
      this.availableItems.set(filteredItems);
    } catch (error) {
      console.error('Error loading available items:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error cargando artículos disponibles'
      });
    } finally {
      this.loadingAvailableItems.set(false);
    }
  }

  hideDialog() {
    this.itemDialog.set(false);
    this.submitted.set(false);
  }

  hideEditDialog() {
    this.editItemDialog.set(false);
    this.submitted.set(false);
    this.editingItem = null;
  }

  onItemSelectionChange() {
    // Reset quantity if it exceeds the newly selected item's maximum
    if (this.selectedItemForAdd && this.quantityForAdd > this.selectedItemForAdd.maxQuantity) {
      this.quantityForAdd = Math.min(this.quantityForAdd, this.selectedItemForAdd.maxQuantity);
    }
  }

  saveItem() {
    this.submitted.set(true);
    
    if (!this.selectedItemForAdd || this.quantityForAdd <= 0) {
      return;
    }
    
    // Check if item is already added
    if (this.selectedItemForAdd.isAlreadyAdded) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Este artículo ya ha sido agregado'
      });
      return;
    }
    
    // Check against the selected item's specific maxQuantity
    if (this.quantityForAdd > this.selectedItemForAdd.maxQuantity) {
      return;
    }
    
    if (this.onItemSave) {
      const itemRequest: ItemRequestModel = {
        itemId: this.selectedItemForAdd.id!,
        quantity: this.quantityForAdd
      };
      
      this.onItemSave(itemRequest);
    }
    
    this.hideDialog();
  }

  async editItem(item: EnhancedItemDetails) {
    if (!this.onItemEdit || !item.itemDetails) return;
    
    this.editingItem = item;
    this.quantityForEdit = item.orderItem.quantity || 1;
    this.submitted.set(false);
    this.editItemDialog.set(true);
    
    // Load available items to get quantity limits
    await this.loadAvailableItems();
  }

  saveEditItem() {
    this.submitted.set(true);
    
    if (!this.editingItem || this.quantityForEdit <= 0 || this.quantityForEdit > this.maxQuantityForEdit()) {
      return;
    }
    
    if (this.onItemEdit && this.editingItem.orderItem.itemId) {
      this.onItemEdit({
        itemId: this.editingItem.orderItem.itemId,
        correspondentEntityId: this.editingItem.orderItem.correspondentEntityId,
        quantity: this.quantityForEdit
      });
    }
    
    this.hideEditDialog();
  }

  deleteItem(item: EnhancedItemDetails) {
    if (!this.onItemDelete || !item.orderItem.itemId) return;
    
    this.confirmationService.confirm({
      message: `¿Está seguro que desea eliminar el artículo ${item.itemDetails?.name || item.orderItem.itemId}?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí',
      rejectLabel: 'No',
      accept: () => {
        if (this.onItemDelete && item.orderItem.itemId) {
          this.onItemDelete({
            itemId: item.orderItem.itemId,
            correspondentEntityId: item.orderItem.correspondentEntityId
          });
        }
      }
    });
  }

  // Utility methods for template
  get hasActions(): boolean {
    return !!(this.onItemEdit || this.onItemDelete);
  }

  get canAdd(): boolean {
    if (!this.onItemSave) return false;
    // If forcedFilter is true and no filter is provided, can't add items
    if (this.forcedFilter && (!this.itemFilter || this.itemFilter.length === 0)) {
      return false;
    }
    return true;
  }

  get hasItems(): boolean {
    return this.enhancedItems().length > 0;
  }

  get isLoading(): boolean {
    return this.loading() || this.enhancedItems().some(item => item.loading);
  }
}
