import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinner } from 'primeng/progressspinner';
import { AccordionModule } from 'primeng/accordion';
import { Accordion } from 'primeng/accordion';
import { DialogModule } from 'primeng/dialog';
import { CreateProviderRequestModel, ProviderDetailsResponseModel } from '@birthstonesdevops/topaz.backend.organizationservice';

@Component({
  selector: 'app-providers',
  standalone: true,
  imports: [CommonModule, ToastModule, ToolbarModule, ButtonModule, ProgressSpinner, AccordionModule, DialogModule],
  templateUrl: './providers.component.html',
  styleUrl: './providers.component.css',
  providers: [MessageService, ConfirmationService]
})
export class ProvidersComponent implements OnInit {
  providers: ProviderDetailsResponseModel[] = [];
  addProviderDialog: boolean = false;
  @ViewChild('accordion') accordion!: Accordion;
  loading: boolean = false;

  constructor(private messageService: MessageService) { }

  ngOnInit(): void { }

  openNew(): void {
    this.addProviderDialog = true;
  }

  close(): void {
    this.addProviderDialog = false;
  }

  exportCSV(): void {
    // TODO: Implement CSV export functionality
    console.log('Export providers to CSV');
  }

  collapseAll(): void {
    if (this.accordion) {
      this.accordion.value.set([]);
    }
  }

  addPhone(provider: any): void {
    // TODO: Implement add phone functionality
    console.log('Add phone for provider:', provider.name);
  }

  addNote(provider: any): void {
    // TODO: Implement add note functionality
    console.log('Add note for provider:', provider.name);
  }

  deleteProvider() {
    throw new Error('Method not implemented.');
  }
  editProvider() {
    throw new Error('Method not implemented.');
  }
}
