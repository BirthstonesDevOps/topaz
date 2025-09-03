import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinner } from 'primeng/progressspinner';
import { AccordionModule } from 'primeng/accordion';
import { Accordion } from 'primeng/accordion';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { PaginatorModule } from 'primeng/paginator';
import { 
  CreateProviderRequestModel, 
  ProviderDetailsResponseModel, 
  ProviderService,
  UpdateRequestOfProviderUpdateRequestModel,
  ProviderUpdateRequestModel,
  ProviderPhoneService,
  ProviderPhoneRequestModel,
  ProviderNoteService,
  ProviderNoteRequestModel,
  NoteRequestModel,
  PhoneRequestModel,
  DeleteRequest
} from '@birthstonesdevops/topaz.backend.organizationservice';
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { UserRolesService } from '../../../services/user-roles.service';

@Component({
  selector: 'app-providers',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ToastModule,
    ToolbarModule,
    ButtonModule,
    ProgressSpinner,
    AccordionModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    ConfirmDialogModule,
    IconFieldModule,
    InputIconModule,
    PaginatorModule
],
  templateUrl: './providers.component.html',
  styleUrl: './providers.component.css',
  providers: [MessageService, ConfirmationService]
})
export class ProvidersComponent implements OnInit {
  providers = signal<ProviderDetailsResponseModel[]>([]);
  filteredProviders = signal<ProviderDetailsResponseModel[]>([]);

  userRoles!: number[]; // User roles from local storage
  userRolesService = inject(UserRolesService);
  // Dialog states
  addProviderDialog: boolean = false;
  editProviderDialog: boolean = false;
  addPhoneDialog: boolean = false;
  addNoteDialog: boolean = false;
  
  // Form models
  providerForm: CreateProviderRequestModel = {};
  editingProvider: ProviderDetailsResponseModel = {};
  selectedProvider: ProviderDetailsResponseModel = {};
  newPhone: ProviderPhoneRequestModel = {};
  newNote: ProviderNoteRequestModel = {};
  tempPhones: PhoneRequestModel[] = [];
  tempNotes: NoteRequestModel[] = [];
  
  // Search
  searchTerm: string = '';
  
  // Pagination
  currentPage: number = 0;
  itemsPerPage: number = 5;
  totalItems: number = 0;
  rowsPerPageOptions: number[] = [5, 10, 20];
  
  // States
  @ViewChild('accordion') accordion!: Accordion;
  loading: boolean = false;
  submitted: boolean = false;

  constructor(
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private providerService: ProviderService,
    private providerPhoneService: ProviderPhoneService,
    private providerNoteService: ProviderNoteService
  ) { }

  ngOnInit(): void {
    this.loadProviders();
    
  }

  getUserRoles(){
    this.userRoles = this.userRolesService.userRoles();
  }

  loadProviders(): void {
    this.loading = true;
    this.providerService.providerGetAllProviderDetails().subscribe({
      next: (data) => {
        this.providers.set(data);
        this.filteredProviders.set(data); // Initialize filtered providers
        this.totalItems = data.length;
        this.currentPage = 0; // Reset to first page
        this.loading = false;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error loading providers',
          life: 3000
        });
        this.loading = false;
      }
    });
  }

  // Pagination methods
  getPaginatedProviders(): ProviderDetailsResponseModel[] {
    const start = this.currentPage * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredProviders().slice(start, end);
  }

  onPageChange(event: any): void {
    this.currentPage = event.page;
    this.itemsPerPage = event.rows;
  }

  getTotalFilteredItems(): number {
    return this.filteredProviders().length;
  }

  getCurrentPageEndRange(): number {
    return Math.min((this.currentPage * this.itemsPerPage) + this.itemsPerPage, this.getTotalFilteredItems());
  }

  openNew(): void {
    this.providerForm = {};
    this.tempPhones = [];
    this.tempNotes = [];
    this.submitted = false;
    this.addProviderDialog = true;
  }

  editProvider(provider: ProviderDetailsResponseModel): void {
    this.editingProvider = { ...provider };
    this.editProviderDialog = true;
  }

  deleteProvider(provider: ProviderDetailsResponseModel): void {
    this.confirmationService.confirm({
      message: `¿Está seguro de que desea eliminar el proveedor ${provider.name}?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        if (provider.id) {
          const deleteRequest: DeleteRequest = {
            ids: [new Number(provider.id)]
          };
          
          this.providerService.providerDelete(deleteRequest).subscribe({
            next: () => {
              this.providers.set(this.providers().filter(p => p.id !== provider.id));
              this.filterProviders(); // Update filtered providers and pagination
              this.messageService.add({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Proveedor eliminado correctamente',
                life: 3000
              });
            },
            error: () => {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Error al eliminar el proveedor',
                life: 3000
              });
            }
          });
        }
      }
    });
  }

  saveProvider(): void {
    this.submitted = true;
    
    if (!this.providerForm.name?.trim()) {
      return;
    }

    const createRequest: CreateProviderRequestModel = {
      name: this.providerForm.name,
      address: this.providerForm.address,
      email: this.providerForm.email,
      phones: this.tempPhones,
      notes: this.tempNotes
    };

    this.providerService.providerCreateProvider(createRequest).subscribe({
      next: (newProvider) => {
        this.providers.set([...this.providers(), newProvider]);
        this.filterProviders(); // Update filtered providers and pagination
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Proveedor creado correctamente',
          life: 3000
        });
        this.addProviderDialog = false;
        this.resetForm();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al crear el proveedor',
          life: 3000
        });
      }
    });
  }

  updateProvider(): void {
    if (!this.editingProvider.name?.trim()) {
      return;
    }

    const updateModel: ProviderUpdateRequestModel = {
      name: this.editingProvider.name,
      address: this.editingProvider.address,
      email: this.editingProvider.email
    };

    const updateRequest: UpdateRequestOfProviderUpdateRequestModel = {
      ids: [new Number(this.editingProvider.id!)],
      model: updateModel
    };

    this.providerService.providerUpdate(updateRequest).subscribe({
      next: () => {
        const updatedProviders = this.providers().map(p => 
          p.id === this.editingProvider.id ? { ...this.editingProvider } : p
        );
        this.providers.set(updatedProviders);
        this.filterProviders(); // Update filtered providers
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Proveedor actualizado correctamente',
          life: 3000
        });
        this.editProviderDialog = false;
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al actualizar el proveedor',
          life: 3000
        });
      }
    });
  }

  addPhone(provider: ProviderDetailsResponseModel): void {
    this.selectedProvider = provider;
    this.newPhone = { providerId: provider.id };
    this.addPhoneDialog = true;
  }

  savePhone(): void {
    if (!this.newPhone.phoneNumber?.trim()) {
      return;
    }

    this.providerPhoneService.providerPhoneCreate(this.newPhone).subscribe({
      next: () => {
        this.loadProviders(); // Reload to get updated data
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Teléfono agregado correctamente',
          life: 3000
        });
        this.addPhoneDialog = false;
        this.newPhone = {};
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al agregar el teléfono',
          life: 3000
        });
      }
    });
  }

  addNote(provider: ProviderDetailsResponseModel): void {
    this.selectedProvider = provider;
    this.newNote = { providerId: provider.id };
    this.addNoteDialog = true;
  }

  saveNote(): void {
    if (!this.newNote.content?.trim()) {
      return;
    }

    this.providerNoteService.providerNoteCreate(this.newNote).subscribe({
      next: () => {
        this.loadProviders(); // Reload to get updated data
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Nota agregada correctamente',
          life: 3000
        });
        this.addNoteDialog = false;
        this.newNote = {};
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al agregar la nota',
          life: 3000
        });
      }
    });
  }

  deletePhone(phone: any, provider: ProviderDetailsResponseModel): void {
    this.confirmationService.confirm({
      message: `¿Está seguro de que desea eliminar el teléfono ${phone.phoneNumber}?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        if (phone.id) {
          const deleteRequest: DeleteRequest = {
            ids: [new Number(phone.id)]
          };
          
          this.providerPhoneService.providerPhoneDelete(deleteRequest).subscribe({
            next: () => {
              this.loadProviders(); // Reload to get updated data
              this.messageService.add({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Teléfono eliminado correctamente',
                life: 3000
              });
            },
            error: () => {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Error al eliminar el teléfono',
                life: 3000
              });
            }
          });
        }
      }
    });
  }

  deleteNote(note: any, provider: ProviderDetailsResponseModel): void {
    this.confirmationService.confirm({
      message: `¿Está seguro de que desea eliminar la nota "${note.title || 'Sin título'}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        if (note.id) {
          const deleteRequest: DeleteRequest = {
            ids: [new Number(note.id)]
          };
          
          this.providerNoteService.providerNoteDelete(deleteRequest).subscribe({
            next: () => {
              this.loadProviders(); // Reload to get updated data
              this.messageService.add({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Nota eliminada correctamente',
                life: 3000
              });
            },
            error: () => {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Error al eliminar la nota',
                life: 3000
              });
            }
          });
        }
      }
    });
  }

  // Helper methods for creating new providers
  addTempPhone(): void {
    this.tempPhones.push({ phoneNumber: '' });
  }

  removeTempPhone(index: number): void {
    this.tempPhones.splice(index, 1);
  }

  addTempNote(): void {
    this.tempNotes.push({ title: '', content: '' });
  }

  removeTempNote(index: number): void {
    this.tempNotes.splice(index, 1);
  }

  collapseAll(): void {
    if (this.accordion) {
      this.accordion.value.set([]);
    }
  }

  close(): void {
    this.addProviderDialog = false;
    this.editProviderDialog = false;
    this.addPhoneDialog = false;
    this.addNoteDialog = false;
    this.resetForm();
  }

  private resetForm(): void {
    this.providerForm = {};
    this.editingProvider = {};
    this.newPhone = {};
    this.newNote = {};
    this.tempPhones = [];
    this.tempNotes = [];
    this.submitted = false;
  }

  filterProviders(): void {
    if (!this.searchTerm) {
      this.filteredProviders.set(this.providers());
    } else {
      const lowerCaseSearchTerm = this.searchTerm.toLowerCase();
      this.filteredProviders.set(
        this.providers().filter(provider => 
          provider.name?.toLowerCase().includes(lowerCaseSearchTerm) || false
        )
      );
    }
    
    // Reset to first page when filtering
    this.currentPage = 0;
    
    // Update total items count
    this.totalItems = this.filteredProviders().length;
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filteredProviders.set(this.providers());
    this.currentPage = 0;
    this.totalItems = this.providers().length;
  }
}
