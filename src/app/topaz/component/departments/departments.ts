import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { RadioButtonModule } from 'primeng/radiobutton';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DeleteRequest, LocationService } from '@birthstonesdevops/topaz.backend.organizationservice';
import { LocationResponseModel, LocationRequestModel } from '@birthstonesdevops/topaz.backend.organizationservice';

interface Column {
    field: string;
    header: string;
    customExportHeader?: string;
}

interface ExportColumn {
    title: string;
    dataKey: string;
}

@Component({
    selector: 'app-departments',
    standalone: true,
    imports: [
        CommonModule,
        TableModule,
        FormsModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        ToolbarModule,
        InputTextModule,
        TextareaModule,
        SelectModule,
        RadioButtonModule,
        DialogModule,
        TagModule,
        InputIconModule,
        IconFieldModule,
        ConfirmDialogModule,
        ProgressSpinnerModule
    ],
    template: `
        <p-toast></p-toast>
        
        <p-toolbar styleClass="mb-6" *ngIf="!loading">
                        <ng-template #start>
                            <p-button label="Nuevo" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="openNew()" />
                            <p-button severity="danger" label="Eliminar" icon="pi pi-trash" outlined (onClick)="deleteSelectedDepartments()" [disabled]="!selectedDepartments || !selectedDepartments.length" />
                        </ng-template>

                        <ng-template #end>
                            <p-button label="Exportar" icon="pi pi-upload" severity="secondary" (onClick)="exportCSV()" />
                        </ng-template>
                            </p-toolbar>

        <div *ngIf="loading" class="card">
            <div class="text-center">
                <p-progressSpinner 
                    [style]="{'width': '50px', 'height': '50px'}"
                    strokeWidth="6"
                    styleClass="custom-spinner">
                </p-progressSpinner>
                <div class="mt-3 text-primary font-bold text-lg">Cargando...</div>
            </div>
        </div>

        <p-table
            #dt
            *ngIf="!loading"
            [value]="departments()"
            [rows]="20"
            [columns]="cols"
            [paginator]="true"
            [globalFilterFields]="['name', 'description', 'address']"
            [tableStyle]="{ 'min-width': '75rem' }"
            [(selection)]="selectedDepartments"
            [rowHover]="true"
            dataKey="id"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} departamentos"
            [showCurrentPageReport]="true"
            [rowsPerPageOptions]="[10, 20, 30, 50]"
        >
                        <ng-template #caption>
                            <div class="flex items-center justify-between">
                                <h5 class="m-0">Gestionar Departamentos</h5>
                                <p-iconfield>
                                    <p-inputicon styleClass="pi pi-search" />
                                    <input pInputText type="text" (input)="onGlobalFilter(dt, $event)" placeholder="Buscar..." />
                                </p-iconfield>
                            </div>
                        </ng-template>
                        <ng-template #header>
                            <tr>
                                <th style="width: 3rem">
                                    <p-tableHeaderCheckbox />
                                </th>
                                <th pSortableColumn="address" style="min-width: 16rem">
                                    Dirección
                                    <p-sortIcon field="address" />
                                </th>
                                <th pSortableColumn="name" style="min-width:16rem">
                                    Nombre
                                    <p-sortIcon field="name" />
                                </th>
                                <th pSortableColumn="description" style="min-width:20rem">
                                    Descripción
                                    <p-sortIcon field="description" />
                                </th>
                                <th style="min-width: 8rem">
                                    Fecha Creación
                                </th>
                                <th></th>
                            </tr>
                        </ng-template>
                        <ng-template #body let-department>
                            <tr>
                                <td style="width: 3rem">
                                    <p-tableCheckbox [value]="department" />
                                </td>
                                <td style="min-width: 16rem">{{ department.address }}</td>
                                <td style="min-width: 16rem">{{ department.name }}</td>
                                <td style="min-width: 20rem">{{ department.description }}</td>
                                <td>
                                    {{ department.createdAt | date:'short' }}
                                </td>
                                <td>
                                    <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (click)="editDepartment(department)" />
                                    <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (click)="deleteDepartment(department)" />
                                </td>
                            </tr>
                        </ng-template>
        </p-table>

        <p-dialog [(visible)]="departmentDialog" [style]="{ width: '450px' }" header="Detalles del Departamento" [modal]="true">
                        <ng-template #content>
                            <div class="flex flex-col gap-6">
                                <div>
                                    <label for="name" class="block font-bold mb-3">Nombre</label>
                                    <input type="text" pInputText id="name" [(ngModel)]="department.name" required autofocus fluid />
                                    <small class="text-red-500" *ngIf="submitted && !department.name">El nombre es requerido.</small>
                                </div>
                                <div>
                                    <label for="address" class="block font-bold mb-3">Dirección</label>
                                    <input type="text" pInputText id="address" [(ngModel)]="department.address" fluid />
                                </div>
                                <div>
                                    <label for="description" class="block font-bold mb-3">Descripción</label>
                                    <textarea id="description" pTextarea [(ngModel)]="department.description" rows="3" cols="20" fluid></textarea>
                                </div>
                                <div class="grid grid-cols-12 gap-4">
                                    <div class="col-span-6">
                                        <label for="latitude" class="block font-bold mb-3">Latitud</label>
                                        <input type="number" pInputText id="latitude" [(ngModel)]="department.latitude" fluid />
                                    </div>
                                    <div class="col-span-6">
                                        <label for="longitude" class="block font-bold mb-3">Longitud</label>
                                        <input type="number" pInputText id="longitude" [(ngModel)]="department.longitude" fluid />
                                    </div>
                                </div>
                            </div>
                        </ng-template>

                        <ng-template #footer>
                            <p-button label="Cancelar" icon="pi pi-times" text (click)="hideDialog()" />
                            <p-button label="Guardar" icon="pi pi-check" (click)="saveDepartment()" />
                        </ng-template>
                    </p-dialog>

        <p-confirmdialog [style]="{ width: '450px' }" />
    `,
    providers: [MessageService, ConfirmationService],
    styles: [`
        ::ng-deep .custom-spinner .p-progressspinner-circle {
            stroke: var(--primary-color) !important;
            stroke-dasharray: 89, 200 !important;
            stroke-dashoffset: 0 !important;
            animation: p-progressspinner-dash 1.5s ease-in-out infinite !important;
        }
        
        @keyframes p-progressspinner-dash {
            0% {
                stroke-dasharray: 1, 200;
                stroke-dashoffset: 0;
            }
            50% {
                stroke-dasharray: 89, 200;
                stroke-dashoffset: -35px;
            }
            100% {
                stroke-dasharray: 89, 200;
                stroke-dashoffset: -124px;
            }
        }
    `],
})
export class Departments implements OnInit {
    departmentDialog: boolean = false;

    departments = signal<LocationResponseModel[]>([]);

    department!: LocationRequestModel;

    editingDepartmentId: number | null = null;

    loading: boolean = false;

    selectedDepartments!: LocationResponseModel[] | null;

    submitted: boolean = false;

    @ViewChild('dt') dt!: Table;

    exportColumns!: ExportColumn[];

    cols!: Column[];

    constructor(
        private locationService: LocationService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    exportCSV() {
        this.dt.exportCSV();
    }

    ngOnInit() {
        this.loadDepartments();
        this.initializeColumns();
    }

    loadDepartments() {
        this.loading = true;
        this.locationService.locationGetAll().subscribe({
            next: (data) => {
                this.departments.set(data);
                this.loading = false;
            },
            error: (error) => {
                this.loading = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al cargar los departamentos',
                    life: 3000
                });
                console.error('Error loading departments:', error);
            }
        });
    }

    initializeColumns() {
        this.cols = [
            { field: 'address', header: 'Dirección', customExportHeader: 'Dirección del Departamento' },
            { field: 'name', header: 'Nombre' },
            { field: 'description', header: 'Descripción' },
            { field: 'createdAt', header: 'Fecha Creación' }
        ];

        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.department = {
            name: '',
            address: '',
            description: '',
            latitude: null,
            longitude: null
        };
        this.editingDepartmentId = null;
        this.submitted = false;
        this.departmentDialog = true;
    }

    editDepartment(department: LocationResponseModel) {
        this.department = { 
            name: department.name || '',
            address: department.address || '',
            description: department.description || '',
            latitude: department.latitude,
            longitude: department.longitude
        };
        this.editingDepartmentId = department.id || null;
        this.departmentDialog = true;
    }

    deleteSelectedDepartments() {
        this.confirmationService.confirm({
            message: '¿Está seguro de que desea eliminar los departamentos seleccionados?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                if (this.selectedDepartments) {
                    const departmentsToDelete = this.selectedDepartments.filter(dept => dept.id);
                    
                    if (departmentsToDelete.length > 0) {
                        this.loading = true;
                        let completedDeletes = 0;
                        let successfulDeletes = 0;
                        const totalDeletes = departmentsToDelete.length;
                        
                        departmentsToDelete.forEach(department => {
                            this.locationService.locationDelete({ ids: [new Number(department.id!)] }).subscribe({
                                next: () => {
                                    successfulDeletes++;
                                    completedDeletes++;
                                    this.checkDeletionCompletion(completedDeletes, totalDeletes, successfulDeletes);
                                },
                                error: (error) => {
                                    completedDeletes++;
                                    console.error('Error deleting department:', department.name, error);
                                    this.checkDeletionCompletion(completedDeletes, totalDeletes, successfulDeletes);
                                }
                            });
                        });
                    }
                }
            }
        });
    }

    private checkDeletionCompletion(completed: number, total: number, successful: number) {
        if (completed === total) {
            this.loading = false;
            
            // Refresh the departments list
            this.loadDepartments();
            
            this.selectedDepartments = null;
            
            if (successful === total) {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Exitoso',
                    detail: `${successful} departamento(s) eliminado(s)`,
                    life: 3000
                });
            } else if (successful > 0) {
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Parcialmente exitoso',
                    detail: `${successful} de ${total} departamento(s) eliminado(s)`,
                    life: 3000
                });
            } else {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudieron eliminar los departamentos',
                    life: 3000
                });
            }
        }
    }

    hideDialog() {
        this.departmentDialog = false;
        this.submitted = false;
    }

    deleteDepartment(department: LocationResponseModel) {
        this.confirmationService.confirm({
            message: '¿Está seguro de que desea eliminar ' + department.name + '?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                if (department.id) {
                    this.loading = true;
                    this.locationService.locationDelete({ ids: [new Number(department.id)] }).subscribe({
                        next: () => {
                            this.loading = false;
                            // Refresh the departments list
                            this.loadDepartments();
                            
                            this.department = {
                                name: '',
                                address: '',
                                description: '',
                                latitude: null,
                                longitude: null
                            };
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Exitoso',
                                detail: 'Departamento Eliminado',
                                life: 3000
                            });
                        },
                        error: (error) => {
                            this.loading = false;
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: 'Error al eliminar el departamento',
                                life: 3000
                            });
                            console.error('Error deleting department:', error);
                        }
                    });
                }
            }
        });
    }

    findIndexById(id: number): number {
        let index = -1;
        for (let i = 0; i < this.departments().length; i++) {
            if (this.departments()[i].id === id) {
                index = i;
                break;
            }
        }
        return index;
    }

    saveDepartment() {
        this.submitted = true;
        
        if (this.department.name?.trim()) {
            if (this.editingDepartmentId) {
                // Update existing department
                this.locationService.locationUpdate({
                    ids: [new Number(this.editingDepartmentId)],
                    model: this.department
                }).subscribe({
                    next: (updatedDepartment) => {
                        const index = this.findIndexById(this.editingDepartmentId!);
                        if (index !== -1) {
                            const departments = [...this.departments()];
                            departments[index] = updatedDepartment;
                            this.departments.set(departments);
                        }
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: 'Departamento Actualizado',
                            life: 3000
                        });
                        this.departmentDialog = false;
                        this.department = {
                            name: '',
                            address: '',
                            description: '',
                            latitude: null,
                            longitude: null
                        };
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al actualizar el departamento',
                            life: 3000
                        });
                        console.error('Error updating department:', error);
                    }
                });
            } else {
                // Create new department
                this.locationService.locationCreate(this.department).subscribe({
                    next: (newDepartment) => {
                        this.departments.set([...this.departments(), newDepartment]);
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: 'Departamento Creado',
                            life: 3000
                        });
                        this.departmentDialog = false;
                        this.department = {
                            name: '',
                            address: '',
                            description: '',
                            latitude: null,
                            longitude: null
                        };
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al crear el departamento',
                            life: 3000
                        });
                        console.error('Error creating department:', error);
                    }
                });
            }
        }
    }
} 