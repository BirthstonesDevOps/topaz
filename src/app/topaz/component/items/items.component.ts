import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';
import { ToastModule } from "primeng/toast";
import { ToolbarModule } from "primeng/toolbar";
import { ButtonModule } from "primeng/button";
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ItemDetailsResponseModel } from '@birthstonesdevops/topaz.backend.itemsservice';

@Component({
  selector: 'app-items',
  imports: [CommonModule, ToastModule, ToolbarModule, ButtonModule, ProgressSpinnerModule],
  templateUrl: './items.component.html',
  styleUrl: './items.component.css',
  providers: [MessageService]
})
export class ItemsComponent implements OnInit {
  loading: boolean = false;
  items = signal<ItemDetailsResponseModel[]>([]);

  ngOnInit(): void {
  }

  exportCSV() {
  }
  
  openNew() {
  }

}
