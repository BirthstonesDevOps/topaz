import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from "primeng/toast";
import { ToolbarModule } from "primeng/toolbar";
import { ButtonModule } from "primeng/button";
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ItemDetailsResponseModel, CreateItemRequestModel, CreatePriceRequestModel } from '@birthstonesdevops/topaz.backend.itemsservice';
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
    FluidModule
  ],
  templateUrl: './items.component.html',
  styleUrl: './items.component.css',
  providers: [MessageService, ConfirmationService]
})
export class ItemsComponent implements OnInit {
  loading: boolean = true;
  
  items = signal<ItemDetailsResponseModel[]>([]);
  providers = signal<ProviderResponseModel[]>([]);
  categories = signal<CategoryTreeModel[]>([]);
  currencies = signal<CurrencyResponseModel[]>([]);

  // Dialog state
  itemDialog: boolean = false;
  submitted: boolean = false;

  // Form models
  itemForm: CreateItemRequestModel = { categoryId: 0 };
  categoryTreeNodes = signal<TreeNode[]>([]);
  selectedCategoryNode: TreeNode | null = null;
  prices: PriceFormModel[] = [];

  constructor(
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private providerService: ProviderService,
    private categoryService: CategoryService,
    private currencyService: CurrencyService
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  private loadInitialData(): void {
    this.loading = true;

    forkJoin({
      providers: this.providerService.providerGetAll(),
      categories: this.categoryService.categoryGetAll(),
      currencies: this.currencyService.currencyGetAll()
    }).subscribe({
      next: (data) => {
        this.providers.set(data.providers);
        this.categories.set(this.buildCategoryTree(data.categories));
        this.categoryTreeNodes.set(this.convertToTreeNodes(this.categories()));
        this.currencies.set(data.currencies);
        this.loading = false;
        console.log(this.categories());
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

  openNew() {
    this.itemForm = { categoryId: 0 };
    this.selectedCategoryNode = null;
    this.prices = [];
    this.submitted = false;
    this.itemDialog = true;
  }

  hideDialog() {
    this.itemDialog = false;
    this.submitted = false;
  }

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

  saveItem() {
    this.submitted = true;

    if (this.isFormValid()) {
      // Set category ID from selected tree node
      if (this.selectedCategoryNode?.key) {
        this.itemForm.categoryId = parseInt(this.selectedCategoryNode.key);
      }

      // Set prices
      this.itemForm.prices = this.prices.filter(price => 
        price.providerId && price.currencyId && price.price
      );

      console.log('Item to save:', this.itemForm);
      // TODO: Implement actual save logic here
      
      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Artículo creado correctamente'
      });
      
      this.hideDialog();
    }
  }

  private isFormValid(): boolean {
    return !!(
      this.itemForm.name?.trim() &&
      this.selectedCategoryNode &&
      this.hasValidPrices()
    );
  }

  hasValidPrices(): boolean {
    return this.prices.some(price => 
      price.providerId && price.currencyId && price.price
    );
  }

  exportCSV() {
  }

}
