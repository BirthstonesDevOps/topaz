import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from "primeng/toast";
import { ToolbarModule } from "primeng/toolbar";
import { ButtonModule } from "primeng/button";
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ItemDetailsResponseModel, CreateItemRequestModel, CreatePriceRequestModel, ItemService, DeleteRequest, ItemPriceService, ItemPriceRequestModel } from '@birthstonesdevops/topaz.backend.itemsservice';
import { ProviderService, ProviderResponseModel } from '@birthstonesdevops/topaz.backend.organizationservice';
import { CategoryService, CategoryResponseModel, CurrencyService, CurrencyResponseModel } from '@birthstonesdevops/topaz.backend.itemsservice';
import { forkJoin } from 'rxjs';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { TreeSelectModule } from 'primeng/treeselect';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { FormsModule } from '@angular/forms';
import { FluidModule } from 'primeng/fluid';
import { TreeNode } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { RippleModule } from 'primeng/ripple';
import { UserRolesService } from '../../../services/user-roles.service';
import { ItemCacheService } from '../../../services/item-cache.service';

export interface CategoryTreeModel {
  id: number;
  name: string;
  children: CategoryTreeModel[];
}

export interface PriceFormModel {
  providerId?: number;
  currencyId?: number;
  price?: number;
}



@Component({
  selector: 'app-items',
  imports: [
    CommonModule, 
    ToastModule, 
    ToolbarModule, 
    ButtonModule, 
    ProgressSpinnerModule, 
    ConfirmDialogModule,
    DialogModule,
    TreeSelectModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    InputNumberModule,
    FormsModule,
    FluidModule,
    TableModule,
    InputIconModule,
    IconFieldModule,
    TagModule,
    TooltipModule,
    RippleModule
  ],
  templateUrl: './items.component.html',
  styleUrl: './items.component.css',
  providers: [MessageService, ConfirmationService]
})
export class ItemsComponent implements OnInit {
  loading: boolean = true;
  userRolesSv = inject(UserRolesService);
  userRoles!:any;
  items = signal<ItemDetailsResponseModel[]>([]);
  providers = signal<ProviderResponseModel[]>([]);
  categories = signal<CategoryTreeModel[]>([]);
  currencies = signal<CurrencyResponseModel[]>([]);

  // Dialog states
  itemDialog: boolean = false;
  addPriceDialog: boolean = false;
  viewPricesDialog: boolean = false;
  viewDescriptionDialog: boolean = false;
  submitted: boolean = false;

  // Form models
  itemForm: CreateItemRequestModel = { categoryId: 0 };
  categoryTreeNodes = signal<TreeNode[]>([]);
  selectedCategoryNode: TreeNode | null = null;
  prices: PriceFormModel[] = [];

  // Price management
  selectedItem: ItemDetailsResponseModel = {};
  newPrice: CreatePriceRequestModel = {};

  // Price viewing
  selectedItemForPrices: ItemDetailsResponseModel = {};
  priceSearchTerm: string = '';
  filteredPrices: any[] = [];

  // Description viewing
  selectedItemForDescription: ItemDetailsResponseModel = {};

  @ViewChild('dt') dt!: Table;

  constructor(
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private providerService: ProviderService,
    private categoryService: CategoryService,
    private currencyService: CurrencyService,
    private itemService: ItemService,
    private itemPriceService: ItemPriceService,
    private itemCacheService: ItemCacheService
  ) {}

  ngOnInit(): void {
    this.getUserRoles();
    this.loadInitialData();
  }

  async getUserRoles() {
    this.userRoles = this.userRolesSv.userRoles();
    console.log('User roles in items component:', this.userRoles);
  }

  private loadInitialData(): void {
    this.loading = true;
    let forkJoinObj:any;
    let local = localStorage.getItem('allItemsCache');
    if(local){
      const cachedItems: ItemDetailsResponseModel[] = JSON.parse(local);
      this.items.set(cachedItems);
      forkJoinObj = {providers: this.providerService.providerGetAll(),
      categories: this.categoryService.categoryGetAll(),
      currencies: this.currencyService.currencyGetAll()}
    } else{
      forkJoinObj = {providers: this.providerService.providerGetAll(),
      categories: this.categoryService.categoryGetAll(),
      currencies: this.currencyService.currencyGetAll(),
      items: this.itemService.itemGetAllItemsDetails()}
    }
    forkJoin(forkJoinObj
    ).subscribe({
      next: (data:any) => {
        this.providers.set(data.providers);
        this.categories.set(this.buildCategoryTree(data.categories));
        this.categoryTreeNodes.set(this.convertToTreeNodes(this.categories()));
        this.currencies.set(data.currencies);
        data.items && this.items.set(data.items);
        
        this.loading = false;
        console.log('Loaded items:', this.items());
      },
      error: (error) => {
        console.error('Error loading initial data:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al cargar los datos iniciales'
        });
        this.loading = false;
      }
    });
  }

  private refreshData() {
    return forkJoin({
      providers: this.providerService.providerGetAll(),
      categories: this.categoryService.categoryGetAll(),
      currencies: this.currencyService.currencyGetAll(),
      items: this.itemService.itemGetAllItemsDetails()
    });
  }

  private buildCategoryTree(categories: CategoryResponseModel[]): CategoryTreeModel[] {
    // Create a map for quick lookup
    const categoryMap = new Map<number, CategoryTreeModel>();
    const rootCategories: CategoryTreeModel[] = [];

    // First pass: create all category nodes
    categories.forEach(category => {
      if (category.id && category.name) {
        categoryMap.set(category.id, {
          id: category.id,
          name: category.name,
          children: []
        });
      }
    });

    // Second pass: build the tree structure
    categories.forEach(category => {
      if (category.id && category.name) {
        const categoryNode = categoryMap.get(category.id);
        if (categoryNode) {
          if (category.parentCategoryId) {
            // This is a child category
            const parent = categoryMap.get(category.parentCategoryId);
            if (parent) {
              parent.children.push(categoryNode);
            } else {
              // Parent not found, treat as root
              rootCategories.push(categoryNode);
            }
          } else {
            // This is a root category
            rootCategories.push(categoryNode);
          }
        }
      }
    });

    return rootCategories;
  }

  private convertToTreeNodes(categories: CategoryTreeModel[]): TreeNode[] {
    return categories.map(category => ({
      key: category.id.toString(),
      label: category.name,
      data: category,
      children: category.children.length > 0 ? this.convertToTreeNodes(category.children) : undefined
    }));
  }

  onGlobalFilter(table: Table, event: Event) {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  getProviderName(providerId?: number): string {
    const provider = this.providers().find(p => p.id === providerId);
    return provider?.name || 'Proveedor desconocido';
  }

  getCurrencyName(currencyId?: number): string {
    const currency = this.currencies().find(c => c.id === currencyId);
    return currency?.name || 'Moneda desconocida';
  }

  getCurrencySymbol(currencyId?: number): string {
    const currency = this.currencies().find(c => c.id === currencyId);
    return currency?.symbol || '$';
  }

  getCurrencyIsoCode(currencyId?: number): string {
    const currency = this.currencies().find(c => c.id === currencyId);
    return currency?.isoCode || 'N/A';
  }

  // Price viewing functionality
  viewItemPrices(item: ItemDetailsResponseModel) {
    this.selectedItemForPrices = item;
    this.priceSearchTerm = '';
    this.filteredPrices = item.itemPrices || [];
    this.viewPricesDialog = true;
  }

  filterPrices() {
    if (!this.priceSearchTerm) {
      this.filteredPrices = this.selectedItemForPrices.itemPrices || [];
      return;
    }

    const searchTerm = this.priceSearchTerm.toLowerCase();
    this.filteredPrices = (this.selectedItemForPrices.itemPrices || []).filter(price => {
      const providerName = this.getProviderName(price.providerId).toLowerCase();
      return providerName.includes(searchTerm);
    });
  }

  clearPriceSearch() {
    this.priceSearchTerm = '';
    this.filteredPrices = this.selectedItemForPrices.itemPrices || [];
  }

  // Description viewing functionality
  viewItemDescription(item: ItemDetailsResponseModel) {
    this.selectedItemForDescription = item;
    this.viewDescriptionDialog = true;
  }


  // Item CRUD operations
  openNew() {
    this.itemForm = { categoryId: 0 };
    this.selectedCategoryNode = null;
    this.prices = [];
    this.submitted = false;
    this.itemDialog = true;
  }



  deleteItem(item: ItemDetailsResponseModel) {
    this.confirmationService.confirm({
      message: `¿Está seguro de que desea eliminar el artículo "${item.name}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        if (item.id) {
          const deleteRequest: DeleteRequest = {
            ids: [new Number(item.id)]
          };
          
          this.itemService.itemDelete(deleteRequest).subscribe({
            next: () => {
              this.items.set(this.items().filter(i => i.id !== item.id));
              this.messageService.add({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Artículo eliminado correctamente',
                life: 3000
              });
            },
            error: (error) => {
              console.error('Error deleting item:', error);
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Error al eliminar el artículo',
                life: 3000
              });
            }
          });
        }
      }
    });
  }

  hideDialog() {
    this.itemDialog = false;
    this.addPriceDialog = false;
    this.viewPricesDialog = false;
    this.viewDescriptionDialog = false;
    this.submitted = false;
    this.resetForm();
  }

  private resetForm() {
    this.itemForm = { categoryId: 0 };
    this.selectedCategoryNode = null;
    this.prices = [];
    this.newPrice = {};
    this.selectedItem = {};
    this.selectedItemForPrices = {};
    this.selectedItemForDescription = {};
    this.priceSearchTerm = '';
    this.filteredPrices = [];
    this.submitted = false;
  }

  // Price management for new items
  addPrice() {
    this.prices.push({
      providerId: undefined,
      currencyId: undefined,
      price: undefined
    });
  }

  removePrice(index: number) {
    this.prices.splice(index, 1);
  }

  // Price management for existing items
  addPriceToItem(item: ItemDetailsResponseModel) {
    this.selectedItem = item;
    this.newPrice = {};
    this.addPriceDialog = true;
  }

  savePriceToItem() {
    if (!this.newPrice.providerId || !this.newPrice.currencyId || !this.newPrice.price) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Todos los campos del precio son requeridos'
      });
      return;
    }

    const itemPriceRequest: ItemPriceRequestModel = {
      itemId: this.selectedItemForPrices.id!,
      providerId: this.newPrice.providerId,
      currencyId: this.newPrice.currencyId,
      price: this.newPrice.price
    };

    this.itemPriceService.itemPriceCreate(itemPriceRequest).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Precio agregado correctamente',
          life: 3000
        });
        
        // Refresh data and then update the dialog with fresh data
        this.refreshData().subscribe({
          next: (data) => {
            this.providers.set(data.providers);
            this.categories.set(this.buildCategoryTree(data.categories));
            this.categoryTreeNodes.set(this.convertToTreeNodes(this.categories()));
            this.currencies.set(data.currencies);
            this.items.set(data.items);
            
            // Close the add price dialog
            this.addPriceDialog = false;
            this.newPrice = {};
            
            // Find the updated item and refresh the prices dialog
            const updatedItem = data.items.find(i => i.id === this.selectedItemForPrices.id);
            if (updatedItem) {
              this.viewItemPrices(updatedItem);
            }
          },
          error: (error) => {
            console.error('Error refreshing data:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Error al actualizar los datos',
              life: 3000
            });
          }
        });
      },
      error: (error) => {
        console.error('Error saving price:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al agregar el precio',
          life: 3000
        });
      }
    });
  }

  deletePriceFromItem(price: any, item: ItemDetailsResponseModel) {
    this.confirmationService.confirm({
      message: `¿Está seguro de que desea eliminar este precio del artículo "${item.name}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        if (price.id) {
          const deleteRequest: DeleteRequest = {
            ids: [new Number(price.id)]
          };

          this.itemPriceService.itemPriceDelete(deleteRequest).subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Precio eliminado correctamente',
                life: 3000
              });
              
              // Refresh data and then update the dialog with fresh data
              this.refreshData().subscribe({
                next: (data) => {
                  this.providers.set(data.providers);
                  this.categories.set(this.buildCategoryTree(data.categories));
                  this.categoryTreeNodes.set(this.convertToTreeNodes(this.categories()));
                  this.currencies.set(data.currencies);
                  this.items.set(data.items);
                  
                  // Find the updated item and refresh the dialog
                  const updatedItem = data.items.find(i => i.id === item.id);
                  if (updatedItem) {
                    this.viewItemPrices(updatedItem);
                  }
                },
                error: (error) => {
                  console.error('Error refreshing data:', error);
                  this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al actualizar los datos',
                    life: 3000
                  });
                }
              });
            },
            error: (error) => {
              console.error('Error deleting price:', error);
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Error al eliminar el precio',
                life: 3000
              });
            }
          });
        }
      }
    });
  }

  saveItem() {
    this.submitted = true;

    if (this.isFormValid()) {
      // Set category ID from selected tree node
      if (this.selectedCategoryNode?.key) {
        this.itemForm.categoryId = parseInt(this.selectedCategoryNode.key);
      }

      // Set prices - filter out incomplete prices
      this.itemForm.prices = this.prices.filter(price => 
        price.providerId && price.currencyId && price.price
      );

      console.log('Creating item:', this.itemForm);
      
      this.itemService.itemCreateItem(this.itemForm).subscribe({
        next: (newItem) => {
          this.items.set([...this.items(), newItem]);
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Artículo creado correctamente',
            life: 3000
          });
          this.hideDialog();
        },
        error: (error) => {
          console.error('Error creating item:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al crear el artículo',
            life: 3000
          });
        }
      });
    }
  }

  private isFormValid(): boolean {
    return !!(
      this.itemForm.name?.trim() &&
      this.selectedCategoryNode
    );
  }

  hasValidPrices(): boolean {
    return this.prices.some(price => 
      price.providerId && price.currencyId && price.price
    );
  }

}
