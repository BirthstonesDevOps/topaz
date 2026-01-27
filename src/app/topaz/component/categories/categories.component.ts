import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { InputTextModule } from 'primeng/inputtext';
import { InputIconModule } from 'primeng/inputicon';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SelectModule } from 'primeng/select';
import { ToolbarModule } from "primeng/toolbar";
import { IconFieldModule } from "primeng/iconfield";
import { UserRolesService } from '../../../services/user-roles.service';

// Import backend service and models
import {
  CategoryService,
  CategoryDetailsResponseModel,
  CategoryRequestModel,
  CategoryResponseModel,
  DeleteRequest,
  UpdateRequestOfCategoryUpdateRequestModel,
  CategoryUpdateRequestModel
} from '@birthstonesdevops/topaz.backend.itemsservice';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    ToastModule,
    ProgressSpinnerModule,
    InputTextModule,
    InputIconModule,
    TableModule,
    TagModule,
    DialogModule,
    TextareaModule,
    ConfirmDialogModule,
    SelectModule,
    ToolbarModule,
    IconFieldModule
  ],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.css',
  providers: [MessageService, ConfirmationService]
})
export class CategoriesComponent implements OnInit {
  userRoles = inject(UserRolesService).userRoles;
  showCreateDialog: boolean = false;
  showEditDialog: boolean = false;
  editCategoryData: CategoryDetailsResponseModel | null = null;

  // Loading state
  loading = signal<boolean>(false);

  // Categories data
  allCategories = signal<CategoryDetailsResponseModel[]>([]);

  // Parent categories for dropdown
  parentCategories = signal<CategoryDetailsResponseModel[]>([]);

  // Delete confirmation dialog
  showDeleteDialog: boolean = false;
  deleteCategoryId: number | null = null;
  deleteNotes: string = '';
  deletingCategory = signal<boolean>(false);

  // Form data for create/edit
  categoryForm = {
    name: '',
    description: '',
    parentId: null as number | null
  };

  constructor(
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private categoryService: CategoryService
  ) {}
    ngOnInit(): void {
        throw new Error('Method not implemented.');
    }

  loadCategories(): void {
    this.loading.set(true);
    this.categoryService.categoryGetAllCategoriesDetails().subscribe({
      next: (categories) => {
        this.allCategories.set(categories);
        // Filter parent categories (those without parent)
        this.parentCategories.set(categories.filter(c => !c.parentCategory));
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load categories'
        });
        this.loading.set(false);
      }
    });
  }

  openCreateDialog(): void {
    this.categoryForm = { name: '', description: '', parentId: null };
    this.showCreateDialog = true;
  }

  openEditDialog(category: CategoryDetailsResponseModel): void {
    this.editCategoryData = category;
    this.categoryForm = {
      name: category.name || '',
      description: category.description || '',
      parentId: category.parentCategory?.id || null
    };
    this.showEditDialog = true;
  }

  closeCreateDialog(): void {
    this.showCreateDialog = false;
  }

  closeEditDialog(): void {
    this.showEditDialog = false;
    this.editCategoryData = null;
  }

  createCategory(): void {
    if (!this.categoryForm.name.trim()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Category name is required'
      });
      return;
    }

    const request: CategoryRequestModel = {
      name: this.categoryForm.name,
      description: this.categoryForm.description || null,
      parentCategoryId: this.categoryForm.parentId || null
    };

    this.categoryService.categoryCreate(request).subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Category created successfully'
        });
        this.closeCreateDialog();
        this.loadCategories(); // Reload to get updated data
      },
      error: (error) => {
        console.error('Error creating category:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to create category'
        });
      }
    });
  }

  updateCategory(): void {
    if (!this.categoryForm.name.trim() || !this.editCategoryData) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Category name is required'
      });
      return;
    }

    const updateRequest: UpdateRequestOfCategoryUpdateRequestModel = {
      ids: [{ id: this.editCategoryData.id! }],
      model: {
        name: this.categoryForm.name,
        description: this.categoryForm.description || null,
        parentCategoryId: this.categoryForm.parentId || null
      }
    };

    this.categoryService.categoryUpdate(updateRequest).subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Category updated successfully'
        });
        this.closeEditDialog();
        this.loadCategories(); // Reload to get updated data
      },
      error: (error) => {
        console.error('Error updating category:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to update category'
        });
      }
    });
  }

  confirmDelete(category: CategoryDetailsResponseModel): void {
    this.deleteCategoryId = category.id!;
    this.deleteNotes = '';
    this.showDeleteDialog = true;
  }

  deleteCategory(): void {
    if (!this.deleteCategoryId) return;

    this.deletingCategory.set(true);
    const deleteRequest: DeleteRequest = {
      ids: [{ id: this.deleteCategoryId }]
    };

    this.categoryService.categoryDelete(deleteRequest).subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Category deleted successfully'
        });
        this.showDeleteDialog = false;
        this.deleteCategoryId = null;
        this.deletingCategory.set(false);
        this.loadCategories(); // Reload to get updated data
      },
      error: (error) => {
        console.error('Error deleting category:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to delete category'
        });
        this.deletingCategory.set(false);
      }
    });
  }

  closeDeleteDialog(): void {
    this.showDeleteDialog = false;
    this.deleteCategoryId = null;
    this.deleteNotes = '';
  }

  getCategoryLevel(category: CategoryDetailsResponseModel): string {
    return category.parentCategory ? 'Subcategoría' : 'Categoría Padre';
  }
}