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
    selector: 'app-locations',
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
    templateUrl: './locations.component.html',
    styleUrls: ['./locations.component.css'],
    providers: [MessageService, ConfirmationService]
})
export class LocationsComponent implements OnInit {
    locationDialog: boolean = false;

    locations = signal<LocationResponseModel[]>([]);

    location!: LocationRequestModel;

    editingLocationId: number | null = null;

    loading: boolean = false;



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
        this.loadLocations();
        this.initializeColumns();
    }

    loadLocations() {
        this.loading = true;
        this.locationService.locationGetAll().subscribe({
            next: (data) => {
                this.locations.set(data);
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
                console.error('Error loading locations:', error);
            }
        });
    }

    initializeColumns() {
        this.cols = [
            { field: 'address', header: 'Dirección', customExportHeader: 'Dirección del Centro de Producción' },
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
        this.location = {
            name: '',
            address: '',
            description: '',
            latitude: 0.0,
            longitude: 0.0
        };
        this.editingLocationId = null;
        this.submitted = false;
        this.locationDialog = true;
    }

    editLocation(location: LocationResponseModel) {
        this.location = { 
            name: location.name || '',
            address: location.address || '',
            description: location.description || '',
            latitude: 0.0,
            longitude: 0.0
        };
        this.editingLocationId = location.id || null;
        this.locationDialog = true;
    }



    hideDialog() {
        this.locationDialog = false;
        this.submitted = false;
    }

    deleteLocation(location: LocationResponseModel) {
        this.confirmationService.confirm({
            message: '¿Está seguro de que desea eliminar ' + location.name + '?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                if (location.id) {
                    this.loading = true;
                    this.locationService.locationDelete({ ids: [new Number(location.id)] }).subscribe({
                        next: () => {
                            this.loading = false;
                            // Refresh the locations list
                            this.loadLocations();
                            
                            this.location = {
                                name: '',
                                address: '',
                                description: '',
                                latitude: 0.0,
                                longitude: 0.0
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
                            console.error('Error deleting location:', error);
                        }
                    });
                }
            }
        });
    }

    findIndexById(id: number): number {
        let index = -1;
        for (let i = 0; i < this.locations().length; i++) {
            if (this.locations()[i].id === id) {
                index = i;
                break;
            }
        }
        return index;
    }

    saveLocation() {
        this.submitted = true;
        
        if (this.location.name?.trim()) {
            if (this.editingLocationId) {
                // Update existing location
                this.locationService.locationUpdate({
                    ids: [new Number(this.editingLocationId)],
                    model: this.location
                }).subscribe({
                    next: (updatedLocation) => {
                        const index = this.findIndexById(this.editingLocationId!);
                        if (index !== -1) {
                            const locations = [...this.locations()];
                            locations[index] = updatedLocation;
                            this.locations.set(locations);
                        }
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: 'Centro de Producción Actualizado',
                            life: 3000
                        });
                        this.locationDialog = false;
                        this.location = {
                            name: '',
                            address: '',
                            description: '',
                            latitude: 0.0,
                            longitude: 0.0
                        };
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al actualizar el centro de producción',
                            life: 3000
                        });
                        console.error('Error updating location:', error);
                    }
                });
            } else {
                // Create new location
                this.locationService.locationCreate(this.location).subscribe({
                    next: (newLocation) => {
                        this.locations.set([...this.locations(), newLocation]);
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: 'Centro de Producción Creado',
                            life: 3000
                        });
                        this.locationDialog = false;
                        this.location = {
                            name: '',
                            address: '',
                            description: '',
                            latitude: 0.0,
                            longitude: 0.0
                        };
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al crear el centro de producción',
                            life: 3000
                        });
                        console.error('Error creating location:', error);
                    }
                });
            }
        }
    }
} 