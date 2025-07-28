import { Component, OnInit, signal } from '@angular/core';
import { PurchaseOrderDetailsResponseModel } from '@birthstonesdevops/topaz.backend.ordersservice';
import { LocationResponseModel } from '@birthstonesdevops/topaz.backend.organizationservice';

@Component({
  selector: 'app-orders',
  imports: [],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss'
})
export class OrdersComponent implements OnInit {

  
  orders = signal<PurchaseOrderDetailsResponseModel[]>([]);

  ngOnInit(): void {
    this.orders.set([]);
  }

}
