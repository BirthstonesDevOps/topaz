import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimelineModule } from 'primeng/timeline';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { 
  StatusHistoryDetailsResponseModel 
} from '@birthstonesdevops/topaz.backend.ordersservice';

@Component({
  selector: 'app-status-note-tree',
  standalone: true,
  imports: [CommonModule, TimelineModule, CardModule, TagModule],
  templateUrl: './status-note-tree.component.html',
  styleUrls: ['./status-note-tree.component.css']
})
export class StatusNoteTreeComponent {
  @Input() statusHistory: StatusHistoryDetailsResponseModel[] = [];

  getStatusSeverity(status: string | null | undefined): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
    if (!status) return 'secondary';
    
    const statusLower = status.toLowerCase();
    
    // Map status names to PrimeNG tag severities
    if (statusLower.includes('completed') || statusLower.includes('delivered') || statusLower.includes('approved')) {
      return 'success';
    } else if (statusLower.includes('processing') || statusLower.includes('in progress') || statusLower.includes('pending')) {
      return 'info';
    } else if (statusLower.includes('review') || statusLower.includes('waiting') || statusLower.includes('hold')) {
      return 'warning';
    } else if (statusLower.includes('cancelled') || statusLower.includes('rejected') || statusLower.includes('failed')) {
      return 'danger';
    } else {
      return 'secondary';
    }
  }

  getStatusIcon(status: string | null | undefined): string {
    if (!status) return 'pi pi-circle';
    
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes('completed') || statusLower.includes('delivered') || statusLower.includes('approved')) {
      return 'pi pi-check-circle';
    } else if (statusLower.includes('processing') || statusLower.includes('in progress')) {
      return 'pi pi-cog';
    } else if (statusLower.includes('pending') || statusLower.includes('waiting')) {
      return 'pi pi-clock';
    } else if (statusLower.includes('review')) {
      return 'pi pi-eye';
    } else if (statusLower.includes('cancelled') || statusLower.includes('rejected') || statusLower.includes('failed')) {
      return 'pi pi-times-circle';
    } else if (statusLower.includes('shipped') || statusLower.includes('sent')) {
      return 'pi pi-send';
    } else {
      return 'pi pi-circle';
    }
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateString;
    }
  }
}
