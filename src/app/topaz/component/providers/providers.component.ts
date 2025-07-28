import { Component, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
  selector: 'app-providers',
  standalone: true,
  imports: [],
  templateUrl: './providers.component.html',
  styleUrl: './providers.component.css',
  providers: [MessageService, ConfirmationService]
})
export class ProvidersComponent implements OnInit {
  
    ngOnInit(): void {
    }
}
