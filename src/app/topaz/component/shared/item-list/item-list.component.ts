/**
 * ItemListComponent - A comprehensive component for managing item lists in orders
 * 
 * Usage Example:
 * <app-item-list
 *   [items]="orderItems"
 *   [itemFilter]="pendingItems"
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
 * 
 * ItemFilter behavior:
 * - If itemFilter is provided: Only those items are available for adding, with quantity limits from the filter
 * - If itemFilter is empty/undefined: All items are available for adding with unlimited quantities
 * - Editing: If itemFilter is provided, quantities are limited by filter values; otherwise unlimited
 */

import { Component, Input, OnInit, OnChanges, SimpleChanges, ViewChild, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
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
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { ItemService } from '@birthstonesdevops/topaz.backend.itemsservice';
import { ItemDetailsResponseModel as OrderItemDetailsResponseModel } from '@birthstonesdevops/topaz.backend.ordersservice';
import { 
  ItemResponseModel, 
  ItemDetailsResponseModel as ItemServiceItemDetailsResponseModel,
  GetRequest 
} from '@birthstonesdevops/topaz.backend.itemsservice';
import { ItemRequestModel } from '@birthstonesdevops/topaz.backend.ordersservice';
import { UserRolesService } from '../../../../services/user-roles.service';

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
  DropdownModule,
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
  @Input() showMeasurement: boolean = false;
  @Input() showDescription: boolean = false;
  @Input() onItemSave?: (item: ItemRequestModel) => void;
  @Input() onItemDelete?: (data: { itemId: number; correspondentEntityId?: number }) => void;
  @Input() onItemEdit?: (data: { itemId: number; correspondentEntityId?: number; quantity: number }) => void;
  @Input() place!:string;

  @ViewChild('dt') dt!: Table;

  userRoles = inject(UserRolesService).userRoles();

  enhancedItems = signal<EnhancedItemDetails[]>([]);
  loading = signal<boolean>(true);
  globalFilter = signal<string>('');
  
  // Dialog states
  itemDialog = signal<boolean>(false);
  editItemDialog = signal<boolean>(false);
  submitted = signal<boolean>(false);
  
  // Form data
  availableItems = signal<FilterItemData[]>([]);
  selectedItemForAdd: FilterItemData | null = null;
  quantityForAdd: number = 1;
  editingItem = signal<EnhancedItemDetails | null>(null);
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

  // Check if there are items available to add (not already added)
  hasItemsToAdd = computed(() => {
    if (!this.canAdd) return false;
    return this.availableItems().some(item => !item.isAlreadyAdded);
  });

  // Check if paginator should be shown (only if items count >= minimum page size)
  shouldShowPaginator = computed(() => {
    const minPageSize = 10; // Minimum from rowsPerPageOptions
    return this.enhancedItems().length >= minPageSize;
  });

  // Computed maximum quantities
  maxQuantityForAdd = computed(() => {
    if (!this.selectedItemForAdd) return 999999;
    
    // If item is already added, quantity should be 0
    if (this.selectedItemForAdd.isAlreadyAdded) return 0;
    
    return this.selectedItemForAdd.maxQuantity;
  });

  maxQuantityForEdit = computed(() => {
    if (!this.editingItem()?.orderItem.itemId) {
      return 999999;
    }
    
    // If filter is provided, check if item exists in filter
    if (this.itemFilter && this.itemFilter.length > 0) {
      const editingItemId = this.editingItem()?.orderItem.itemId;
      
      const filterItem = this.itemFilter.find(item => item.itemId === editingItemId);
      
      if (!filterItem) {
        return 0; // Item not in filter, so max quantity is 0
      }
      // Use the quantity from the filter as the maximum
      return filterItem.quantity || 1;
    }
    
    // No filter or empty filter: unlimited editing
    return 999999;
  });

  constructor(
    private itemService: ItemService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  async ngOnInit() {
    this.initializeColumns();
    await this.loadAllItemsToCacheIfNeeded();
    this.loadItemDetails();
    // Load available items initially to determine if add button should be shown
    if (this.onItemSave) {
      this.loadAvailableItems();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['items'] && !changes['items'].firstChange) {
      this.loadItemDetails();
      // Reload available items when items change to update hasItemsToAdd
      if (this.onItemSave) {
        this.loadAvailableItems();
      }
    }
    if ((changes['itemFilter'] && !changes['itemFilter'].firstChange)) {
      // Clear available items when filter changes, they'll be reloaded
      this.availableItems.set([]);
      // Reload available items when filter changes
      if (this.onItemSave) {
        this.loadAvailableItems();
      }
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
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    const enhanced: EnhancedItemDetails[] = this.items.map(orderItem => ({
      orderItem,
      itemDetails: null,
      loading: true
    }));
    this.enhancedItems.set(enhanced);

    // Prepare all observables for forkJoin
    const itemDetailObservables = enhanced.map((enh, i) => {
      const orderItem = enh.orderItem;
      if (orderItem.itemId) {
        const getRequest: GetRequest = { ids: [orderItem.itemId] };
        return this.itemService.itemGetById(getRequest).pipe(
          catchError(error => {
            console.error(`Error loading item details for item ${orderItem.itemId}:`, error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: `Error cargando detalles del artículo ${orderItem.itemId}`
            });
            return of(null);
          })
        );
      } else {
        return of(null);
      }
    });

    forkJoin(itemDetailObservables).subscribe(results => {
      results.forEach((itemDetails, i) => {
        enhanced[i].itemDetails = itemDetails;
        enhanced[i].loading = false;
      });
      this.enhancedItems.set([...enhanced]);
      this.loading.set(false);
      console.log('loading: ', this.loading());
    });
  }

  onGlobalFilter(table: Table, event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.globalFilter.set(filterValue);
    table.filterGlobal(filterValue, 'contains');
  }

  async openNew() {
    if (!this.onItemSave) return;
    
    // Ensure available items are loaded
    if (this.availableItems().length === 0) {
      await this.loadAvailableItems();
    }
    
    this.selectedItemForAdd = null;
    this.quantityForAdd = 1;
    this.submitted.set(false);
    this.itemDialog.set(true);
  }

  setSelectedItemsOnBottom(){
    let selecteItems = this.availableItems().filter(item => item.isAlreadyAdded);
    let unselectedItems = this.availableItems().filter(item => !item.isAlreadyAdded);
    this.availableItems.set([...unselectedItems, ...selecteItems]);
  }


  // LocalStorage cache key
  private readonly LOCAL_STORAGE_KEY = 'allItemsCache';


  private saveItemsToLocalStorage(items: ItemServiceItemDetailsResponseModel[]) {
    // Map description: null -> '' for type compatibility
    const mapped = items.map(item => ({
      ...item,
      description: item.description ?? ''
    }));
    localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(mapped));
  }


  private getItemsFromLocalStorage(): ItemResponseModel[] | null {
    const data = localStorage.getItem(this.LOCAL_STORAGE_KEY);
    if (!data) return null;
    try {
      // Map description: null -> '' for type compatibility
      const parsed = JSON.parse(data);
      return Array.isArray(parsed)
        ? parsed.map(item => ({ ...item, description: item.description ?? '' }))
        : null;
    } catch {
      return null;
    }
  }


  private async loadAllItemsToCacheIfNeeded(forceReload = false): Promise<ItemResponseModel[]> {
    if (!forceReload) {
      const cached = this.getItemsFromLocalStorage();
      if (cached && Array.isArray(cached) && cached.length > 0) {
        return cached;
      }
    }
    // Fetch from MS and cache
    try {
      const allItems = await this.itemService.itemGetAllItemsDetails().toPromise();
      if (allItems && Array.isArray(allItems)) {
        this.saveItemsToLocalStorage(allItems);
        // Map description: null -> '' for type compatibility
        return allItems.map(item => ({ ...item, description: item.description ?? '' }));
      }
    } catch (error) {
      console.error('Error loading all items for cache:', error);
    }
    return [];
  }

  // Use this in create/edit/delete item flows:
  async refreshAllItemsCache() {
    await this.loadAllItemsToCacheIfNeeded(true);
  }

  async loadAvailableItems() {
    this.loadingAvailableItems.set(true);
    try {
      let filteredItems: FilterItemData[] = [];
      const allItems = await this.loadAllItemsToCacheIfNeeded();
      // Filter provided: load only filtered items
      if (this.itemFilter && this.itemFilter.length > 0) {
        for (const filterItem of this.itemFilter) {
          if (filterItem.itemId) {
            const itemDetails = allItems.find(item => item.id === filterItem.itemId) || null;
            if (itemDetails) {
              const isAlreadyAdded = this.items.some(existingItem => existingItem.itemId === itemDetails.id);
              filteredItems.push({
                ...itemDetails,
                maxQuantity: filterItem.quantity || 1,
                isAlreadyAdded: isAlreadyAdded
              });
            }
          }
        }
      }
      // Soft filter or no filter: load all items
      else {
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
      this.setSelectedItemsOnBottom();
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
    this.editingItem.set(null);
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
    
    this.editingItem.set(item);
    this.quantityForEdit = item.orderItem.quantity || 1;
    this.submitted.set(false);
    this.editItemDialog.set(true);
    
    // Note: No need to load available items since we use itemFilter directly for validation
  }

  saveEditItem() {
    this.submitted.set(true);
    
    if (!this.editingItem() || this.quantityForEdit <= 0 || this.quantityForEdit > this.maxQuantityForEdit()) {
      return;
    }
    
    if (this.onItemEdit && this.editingItem()?.orderItem.itemId) {
      this.onItemEdit({
        itemId: this.editingItem()!.orderItem.itemId!,
        correspondentEntityId: this.editingItem()!.orderItem.correspondentEntityId,
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
    return true;
  }

  get hasItems(): boolean {
    return this.enhancedItems().length > 0;
  }

  get isLoading(): boolean {
    // If there are items, check if any are loading; otherwise, just use the loading signal
    if (this.enhancedItems().length > 0) {
      return this.loading() || this.enhancedItems().some(item => item.loading);
    }
    return this.loading();
  }
}
