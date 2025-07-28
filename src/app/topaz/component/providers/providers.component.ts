import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from "primeng/toast";
import { ToolbarModule } from "primeng/toolbar";
import { ButtonModule } from "primeng/button";
import { ProgressSpinner } from "primeng/progressspinner";
import { AccordionModule } from "primeng/accordion";
import { Accordion } from "primeng/accordion";
import { ProviderDetailsResponseModel } from '@birthstonesdevops/topaz.backend.organizationservice';

@Component({
  selector: 'app-providers',
  standalone: true,
  imports: [CommonModule, ToastModule, ToolbarModule, ButtonModule, ProgressSpinner, AccordionModule],
  templateUrl: './providers.component.html',
  styleUrl: './providers.component.css',
  providers: [MessageService, ConfirmationService]
})
export class ProvidersComponent implements OnInit {

  providers: ProviderDetailsResponseModel[] = [
    {
      id: 1,
      name: 'Proveedor Ejemplo S.A.',
      address: 'Calle Falsa 123, Ciudad',
      email: 'contacto@proveedorejemplo.com',
      createdAt: '2023-01-01T10:00:00Z',
      updatedAt: '2023-06-01T12:00:00Z',
      phones: [
        { phoneNumber: '+34 600 123 456', id: 1 },
        { phoneNumber: '+34 600 654 321', id: 2 }
      ],
        notes: [
          { id: 1, title: 'Comentario general', content: 'Proveedor confiable.', createdAt: '2023-01-02T09:00:00Z' },
          { id: 2, title: 'Condiciones de pago', content: 'Revisar condiciones de pago.', createdAt: '2023-02-15T14:30:00Z' }
        ]
    },
    {
      id: 2,
      name: 'Distribuciones López',
      address: 'Avenida Principal 456, Pueblo',
      email: null,
      createdAt: '2023-03-10T08:30:00Z',
      updatedAt: null,
      phones: [
      ],
      notes: []
    }
  ];

deleteProvider() {
  throw new Error('Method not implemented.');
}
editProvider() {
  throw new Error('Method not implemented.');
}
  @ViewChild('accordion') accordion!: Accordion;
  loading: boolean = false;
    ngOnInit(): void {
    }

    openNew(): void {
        // TODO: Implement new provider functionality
        console.log('Open new provider dialog');
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
}
