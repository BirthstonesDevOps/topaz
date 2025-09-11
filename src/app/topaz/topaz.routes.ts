import { Routes } from '@angular/router';
import { LocationsComponent } from './component/locations/locations.component';
import { AreasComponent } from './component/areas/areas.component';
import { ProvidersComponent } from './component/providers/providers.component';
import { ItemsComponent } from './component/items/items.component';
import { RequestsComponent } from './component/requests/requests.component';
import { RequestDetailsComponent } from './component/requests/request-details/request-details.component';
import { OrdersComponent } from './component/orders/orders.component';
import { OrderDetailsComponent } from './component/orders/order-details/order-details.component';
import { NoAccessComponent } from './component/no-access.component';

export const topazRoutes: Routes = [
    { path: '', redirectTo: 'providers', pathMatch: 'full' },
    { path: 'locations', component: LocationsComponent },
    { path: 'areas', component: AreasComponent },
    { path: 'providers', component: ProvidersComponent },
    { path: 'items', component: ItemsComponent },
    { path: 'requests', component: RequestsComponent },
    { path: 'requests/:id', component: RequestDetailsComponent },
    { path: 'orders', component: OrdersComponent },
    { path: 'orders/:id', component: OrderDetailsComponent },
    { path:'no-access', component: NoAccessComponent }
];