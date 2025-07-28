import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';

import { 
  RequestDetailsResponseModel, 
  RequestService,
  RequestStatusService,
  StatusDetailsResponseModel,
  GetRequest
} from '@birthstonesdevops/topaz.backend.ordersservice';
import { 
  LocationService, 
  AreaService,
  LocationResponseModel,
  AreaResponseModel
} from '@birthstonesdevops/topaz.backend.organizationservice';
import { StatusNoteTreeComponent } from '../../shared/status-note-tree/status-note-tree.component';

// Extended request interface for detailed display
interface EnrichedRequestDetails extends RequestDetailsResponseModel {
  areaName?: string;
  locationName?: string;
  currentStatus?: StatusDetailsResponseModel;
  currentOperations?: number[];
}

@Component({
  selector: 'app-request-details',
  standalone: true,
  imports: [CommonModule, ButtonModule, ToastModule, ProgressSpinnerModule, TabsModule, TagModule, StatusNoteTreeComponent],
  templateUrl: './request-details.component.html',
  styleUrl: './request-details.component.css',
  providers: [MessageService]
})
export class RequestDetailsComponent implements OnInit {
  requestId: number | null = null;
  requestDetails = signal<EnrichedRequestDetails | null>(null);
  loading = signal<boolean>(false);
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService,
    private requestService: RequestService,
    private requestStatusService: RequestStatusService,
    private areaService: AreaService,
    private locationService: LocationService
  ) {}

  ngOnInit() {
    // Get the ID from the route parameters
    this.route.params.subscribe(params => {
      this.requestId = params['id'] ? +params['id'] : null;
      if (this.requestId) {
        this.loadRequestDetails();
      }
    });
  }

  async loadRequestDetails() {
    if (!this.requestId) return;
    
    this.loading.set(true);
    this.error = null;
    
    try {
      console.log('Cargando detalles del pedido para ID:', this.requestId);
      
      // Get request details by ID
      const getRequest: GetRequest = { ids: [this.requestId] };
      const requestDetails = await this.requestService.requestGetRequestDetailsById(getRequest).toPromise();
      
      if (requestDetails) {
        // Enrich the request with additional information
        const enrichedRequest: EnrichedRequestDetails = { ...requestDetails };
        
        // Get area name
        if (requestDetails.areaId) {
          try {
            const area = await this.areaService.areaGetById({ ids: [requestDetails.areaId] }).toPromise();
            enrichedRequest.areaName = area?.name || 'N/A';
          } catch (error) {
            console.error('Error cargando departamento:', error);
            enrichedRequest.areaName = 'Error cargando departamento';
          }
        }
        
        // Get location name
        if (requestDetails.locationId) {
          try {
            const location = await this.locationService.locationGetById({ ids: [requestDetails.locationId] }).toPromise();
            enrichedRequest.locationName = location?.name || 'N/A';
          } catch (error) {
            console.error('Error cargando centro de producción:', error);
            enrichedRequest.locationName = 'Error cargando centro de producción';
          }
        }
        
        // Get current status (latest status from status history)
        if (requestDetails.statusHistory && requestDetails.statusHistory.length > 0) {
          const latestStatusHistory = requestDetails.statusHistory.sort((a, b) => 
            new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
          )[0];
          enrichedRequest.currentStatus = latestStatusHistory.status || undefined;
          
          // Get status details and operations if we have a current status
          if (enrichedRequest.currentStatus?.id) {
            try {
              const statusDetails = await this.requestStatusService
                .requestStatusGetRequestStatusDetailsById({ ids: [enrichedRequest.currentStatus.id] })
                .toPromise();
              
              if (statusDetails?.operations) {
                // Extract distinct operation IDs
                const operationIds = statusDetails.operations
                  .map(op => op.operationId)
                  .filter((id): id is number => id !== undefined && id !== null)
                  .filter((id, index, arr) => arr.indexOf(id) === index); // Remove duplicates
                
                enrichedRequest.currentOperations = operationIds;
              }
            } catch (error) {
              console.error('Error cargando detalles del estado:', error);
              enrichedRequest.currentOperations = [];
            }
          }
        }
        
        this.requestDetails.set(enrichedRequest);
      } else {
        this.error = 'Pedido no encontrado';
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Pedido no encontrado'
        });
      }
    } catch (error) {
      console.error('Error cargando detalles del pedido:', error);
      this.error = 'Error cargando detalles del pedido';
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error cargando detalles del pedido'
      });
    } finally {
      this.loading.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/requests']);
  }

  // Utility methods
  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusSeverity(tag: string | null | undefined): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" {
    if (!tag) return 'secondary';
    
    switch (tag.toLowerCase()) {
      case 'success': return 'success';
      case 'danger': return 'danger';
      case 'warning': case 'warn': return 'warn';
      case 'info': return 'info';
      case 'contrast': return 'contrast';
      default: return 'secondary';
    }
  }
}
