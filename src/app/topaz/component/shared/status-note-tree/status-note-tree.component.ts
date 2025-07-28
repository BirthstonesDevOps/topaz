import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimelineModule } from 'primeng/timeline';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { StatusDetailsResponseModel, StatusHistoryDetailsResponseModel, StatusHistoryNoteDetailsResponseModel } from '@birthstonesdevops/topaz.backend.ordersservice';


interface TimelineEvent {
  id?: number;
  status?: StatusDetailsResponseModel | null;
  notes?: StatusHistoryNoteDetailsResponseModel[];
  createdAt?: string;
  statusSeverity?: string;
  statusIcon?: string;
  statusColor?: string;
}

@Component({
  selector: 'app-status-note-tree',
  standalone: true,
  imports: [
    CommonModule,
    TimelineModule,
    CardModule,
    TagModule,
    ButtonModule
  ],
  templateUrl: './status-note-tree.component.html',
  styleUrls: ['./status-note-tree.component.css']
})
export class StatusNoteTreeComponent {
  @Input() statusHistory: StatusHistoryDetailsResponseModel[] = [];
  
  timelineEvents: TimelineEvent[] = [];
  
  ngOnInit() {
    this.updateTimelineEvents();
  }
  
  ngOnChanges() {
    this.updateTimelineEvents();
  }
  
  private updateTimelineEvents() {
    if (!this.statusHistory) {
      this.timelineEvents = [];
      return;
    }
    
    this.timelineEvents = this.statusHistory.map(history => ({
      id: history.id,
      status: history.status,
      notes: history.notes || [],
      createdAt: history.createdAt,
      statusSeverity: history.status?.tag || 'secondary',
      statusIcon: history.status?.icon || 'pi pi-circle',
      statusColor: this.getSeverityColor(history.status?.tag || 'secondary')
    }));
    
    // Sort by creation date (newest first)
    this.timelineEvents.sort((a, b) => {
      const dateA = new Date(a.createdAt || '').getTime();
      const dateB = new Date(b.createdAt || '').getTime();
      return dateB - dateA;
    });
  }
  
  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'success': return 'var(--p-tag-success-color)';
      case 'warn': return 'var(--p-tag-warn-color)';
      case 'danger': return 'var(--p-tag-danger-color)';
      case 'info': return 'var(--p-tag-info-color)';
      case 'primary': return 'var(--p-tag-primary-color)';
      case 'secondary': return 'var(--p-tag-secondary-color)';
      case 'contrast': return 'var(--p-tag-contrast-color)';
      default: return 'var(--p-tag-secondary-color)';
    }
  }
  
  getStatusDisplayName(status?: StatusDetailsResponseModel | null): string {
    if (!status) return 'Estado Desconocido';
    return status.status || 'Estado Sin Nombre';
  }
  
  formatDate(dateString?: string): string {
    if (!dateString) return 'Fecha no disponible';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  }
  
  trackByNoteId(index: number, note: StatusHistoryNoteDetailsResponseModel): any {
    return note.id || index;
  }
}
