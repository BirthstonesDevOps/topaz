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
import { LocationService } from '@birthstonesdevops/topaz.backend.organizationservice';
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
    templateUrl: './departments.component.html',
    styleUrls: ['./departments.component.css'],
    providers: [MessageService, ConfirmationService]
})
export class DepartmentsComponent implements OnInit {
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