import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TimelineModule } from 'primeng/timeline';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { StatusDetailsResponseModel, StatusHistoryDetailsResponseModel, StatusHistoryNoteDetailsResponseModel } from '@birthstonesdevops/topaz.backend.ordersservice';
import { Utc3Pipe } from '../pipes/utc3.pipe';


interface TimelineEvent {
  id?: number;
  status?: StatusDetailsResponseModel | null;
  notes?: StatusHistoryNoteDetailsResponseModel[];
  createdAt?: string;
  statusSeverity?: string;
  statusIcon?: string;
  statusColor?: string;
  newNoteText?: string; // For tracking note input per event
}

@Component({
  selector: 'app-status-note-tree',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TimelineModule,
    CardModule,
    TagModule,
    ButtonModule,
    InputTextModule,
    Utc3Pipe
  ],
  templateUrl: './status-note-tree.component.html',
  styleUrls: ['./status-note-tree.component.css']
})
export class StatusNoteTreeComponent {
  @Input() statusHistory: StatusHistoryDetailsResponseModel[] = [];
  @Input() onNoteAdd: (newNote: {id: number, note: string}) => void = () => {};
  
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
      statusIcon: 'pi ' + (history.status?.icon || 'pi-circle'),
      statusColor: this.getSeverityColor(history.status?.tag || 'secondary'),
      newNoteText: '' // Initialize note input text
    }));
    
    // Sort by creation date (oldest first)
    this.timelineEvents.sort((a, b) => {
      const dateA = new Date(a.createdAt || '').getTime();
      const dateB = new Date(b.createdAt || '').getTime();
      return dateA - dateB;
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
      const utc3 = new Date(new Date(dateString).getTime() - (3 * 60 * 60 * 1000)); // Adjust to UTC-3
      return utc3.toLocaleDateString('es-ES', {
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

  trackByEventId(index: number, event: TimelineEvent): any {
    return event.id || index;
  }

  // Method to add a note to a specific status history
  addNoteToStatus(event: TimelineEvent) {
    if (!event.newNoteText?.trim() || !event.id) {
      return;
    }

    // Call the parent component's callback
    this.onNoteAdd({
      id: event.id,
      note: event.newNoteText.trim()
    });

    // Clear the input field
    event.newNoteText = '';
  }

  // Method to handle Enter key press in note input
  onNoteInputKeydown(event: KeyboardEvent, timelineEvent: TimelineEvent) {
    if (event.key === 'Enter') {
      this.addNoteToStatus(timelineEvent);
    }
  }
}
