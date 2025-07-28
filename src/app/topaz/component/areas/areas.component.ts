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
import { AreaService } from '@birthstonesdevops/topaz.backend.organizationservice';
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
    templateUrl: './areas.component.html',
    styleUrls: ['./areas.component.css'],
    providers: [MessageService, ConfirmationService]
})
export class AreasComponent implements OnInit {
    areaDialog: boolean = false;

    areas = signal<AreaResponseModel[]>([]);

    area!: AreaRequestModel;

    editingAreaId: number | null = null;

    loading: boolean = false;



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
                this.loading = false;
            },
            error: (error) => {
                this.loading = false;
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
                            this.loading = false;
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
                            this.loading = false;
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