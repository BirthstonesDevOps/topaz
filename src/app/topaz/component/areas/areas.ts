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
import { DeleteRequest, AreaService } from '@birthstonesdevops/topaz.backend.organizationservice';
import { AreaResponseModel, AreaRequestModel } from '@birthstonesdevops/topaz.backend.organizationservice';

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
    selector: 'app-areas',
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
                            <p-button severity="danger" label="Eliminar" icon="pi pi-trash" outlined (onClick)="deleteSelectedAreas()" [disabled]="!selectedAreas || !selectedAreas.length" />
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
            *ngIf="!loading"
            #dt
            [value]="areas()"
            [rows]="20"
            [columns]="cols"
            [paginator]="true"
            [globalFilterFields]="['name', 'description']"
            [tableStyle]="{ 'min-width': '75rem' }"
            [(selection)]="selectedAreas"
            [rowHover]="true"
            dataKey="id"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} centros de producción"
            [showCurrentPageReport]="true"
            [rowsPerPageOptions]="[10, 20, 30, 50]"
        >
                        <ng-template #caption>
                            <div class="flex items-center justify-between">
                                <h5 class="m-0">Gestionar Centros de Producción</h5>
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
                                <th style="min-width: 8rem">
                                    Última Actualización
                                </th>
                                <th></th>
                            </tr>
                        </ng-template>
                        <ng-template #body let-area>
                            <tr>
                                <td style="width: 3rem">
                                    <p-tableCheckbox [value]="area" />
                                </td>
                                <td style="min-width: 16rem">{{ area.name }}</td>
                                <td style="min-width: 20rem">{{ area.description }}</td>
                                <td>
                                    {{ area.createdAt | date:'short' }}
                                </td>
                                <td>
                                    {{ area.updatedAt | date:'short' }}
                                </td>
                                <td>
                                    <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (click)="editArea(area)" />
                                    <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (click)="deleteArea(area)" />
                                </td>
                            </tr>
                        </ng-template>
        </p-table>

        <p-dialog [(visible)]="areaDialog" [style]="{ width: '450px' }" header="Detalles del Centro de Producción" [modal]="true">
                        <ng-template #content>
                            <div class="flex flex-col gap-6">
                                <div>
                                    <label for="name" class="block font-bold mb-3">Nombre</label>
                                    <input type="text" pInputText id="name" [(ngModel)]="area.name" required autofocus fluid />
                                    <small class="text-red-500" *ngIf="submitted && !area.name">El nombre es requerido.</small>
                                </div>
                                <div>
                                    <label for="description" class="block font-bold mb-3">Descripción</label>
                                    <textarea id="description" pTextarea [(ngModel)]="area.description" rows="3" cols="20" fluid></textarea>
                                </div>
                            </div>
                        </ng-template>

                        <ng-template #footer>
                            <p-button label="Cancelar" icon="pi pi-times" text (click)="hideDialog()" />
                            <p-button label="Guardar" icon="pi pi-check" (click)="saveArea()" />
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
export class Areas implements OnInit {
    areaDialog: boolean = false;

    areas = signal<AreaResponseModel[]>([]);

    area!: AreaRequestModel;

    editingAreaId: number | null = null;

    loading: boolean = false;

    selectedAreas!: AreaResponseModel[] | null;

    submitted: boolean = false;

    @ViewChild('dt') dt!: Table;

    exportColumns!: ExportColumn[];

    cols!: Column[];

    constructor(
        private areaService: AreaService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    exportCSV() {
        this.dt.exportCSV();
    }

    ngOnInit() {
        this.loadAreas();
        this.initializeColumns();
    }

    loadAreas() {
        this.loading = true;
        this.areaService.areaGetAll().subscribe({
            next: (data) => {
                this.areas.set(data);
                //this.loading = false;
            },
            error: (error) => {
                //this.loading = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al cargar los centros de producción',
                    life: 3000
                });
                console.error('Error loading areas:', error);
            }
        });
    }

    initializeColumns() {
        this.cols = [
            { field: 'name', header: 'Nombre' },
            { field: 'description', header: 'Descripción' },
            { field: 'createdAt', header: 'Fecha Creación' },
            { field: 'updatedAt', header: 'Última Actualización' }
        ];

        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.area = {
            name: '',
            description: ''
        };
        this.editingAreaId = null;
        this.submitted = false;
        this.areaDialog = true;
    }

    editArea(area: AreaResponseModel) {
        this.area = { 
            name: area.name || '',
            description: area.description || ''
        };
        this.editingAreaId = area.id || null;
        this.areaDialog = true;
    }

    deleteSelectedAreas() {
        this.confirmationService.confirm({
            message: '¿Está seguro de que desea eliminar los centros de producción seleccionados?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                if (this.selectedAreas) {
                    const areasToDelete = this.selectedAreas.filter(area => area.id);
                    
                    if (areasToDelete.length > 0) {
                        this.loading = true;
                        let completedDeletes = 0;
                        let successfulDeletes = 0;
                        const totalDeletes = areasToDelete.length;
                        
                        areasToDelete.forEach(area => {
                            this.areaService.areaDelete({ ids: [new Number(area.id!)] }).subscribe({
                                next: () => {
                                    successfulDeletes++;
                                    completedDeletes++;
                                    this.checkDeletionCompletion(completedDeletes, totalDeletes, successfulDeletes);
                                },
                                error: (error) => {
                                    completedDeletes++;
                                    console.error('Error deleting area:', area.name, error);
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
            //this.loading = false;
            
            // Refresh the areas list
            this.loadAreas();
            
            this.selectedAreas = null;
            
            if (successful === total) {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Exitoso',
                    detail: `${successful} centro(s) de producción eliminado(s)`,
                    life: 3000
                });
            } else if (successful > 0) {
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Parcialmente exitoso',
                    detail: `${successful} de ${total} centro(s) de producción eliminado(s)`,
                    life: 3000
                });
            } else {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudieron eliminar los centros de producción',
                    life: 3000
                });
            }
        }
    }

    hideDialog() {
        this.areaDialog = false;
        this.submitted = false;
    }

    deleteArea(area: AreaResponseModel) {
        this.confirmationService.confirm({
            message: '¿Está seguro de que desea eliminar ' + area.name + '?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                if (area.id) {
                    this.loading = true;
                    this.areaService.areaDelete({ ids: [new Number(area.id)] }).subscribe({
                        next: () => {
                            //this.loading = false;
                            // Refresh the areas list
                            this.loadAreas();
                            
                            this.area = {
                                name: '',
                                description: ''
                            };
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Exitoso',
                                detail: 'Centro de Producción Eliminado',
                                life: 3000
                            });
                        },
                        error: (error) => {
                            //this.loading = false;
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: 'Error al eliminar el centro de producción',
                                life: 3000
                            });
                            console.error('Error deleting area:', error);
                        }
                    });
                }
            }
        });
    }

    findIndexById(id: number): number {
        let index = -1;
        for (let i = 0; i < this.areas().length; i++) {
            if (this.areas()[i].id === id) {
                index = i;
                break;
            }
        }
        return index;
    }

    saveArea() {
        this.submitted = true;
        
        if (this.area.name?.trim()) {
            if (this.editingAreaId) {
                // Update existing area
                this.areaService.areaUpdate({
                    ids: [new Number(this.editingAreaId)],
                    model: {
                        name: this.area.name,
                        description: this.area.description
                    }
                }).subscribe({
                    next: (updatedArea) => {
                        const index = this.findIndexById(this.editingAreaId!);
                        if (index !== -1) {
                            const areas = [...this.areas()];
                            areas[index] = updatedArea;
                            this.areas.set(areas);
                        }
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: 'Centro de Producción Actualizado',
                            life: 3000
                        });
                        this.areaDialog = false;
                        this.area = {
                            name: '',
                            description: ''
                        };
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al actualizar el centro de producción',
                            life: 3000
                        });
                        console.error('Error updating area:', error);
                    }
                });
            } else {
                // Create new area
                this.areaService.areaCreate(this.area).subscribe({
                    next: (newArea) => {
                        this.areas.set([...this.areas(), newArea]);
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: 'Centro de Producción Creado',
                            life: 3000
                        });
                        this.areaDialog = false;
                        this.area = {
                            name: '',
                            description: ''
                        };
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al crear el centro de producción',
                            life: 3000
                        });
                        console.error('Error creating area:', error);
                    }
                });
            }
        }
    }
} 