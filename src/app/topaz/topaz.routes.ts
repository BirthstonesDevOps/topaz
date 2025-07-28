import { Routes } from '@angular/router';
import { LocationsComponent } from './component/locations/locations.component';
import { AreasComponent } from './component/areas/areas.component';
import { ProvidersComponent } from './component/providers/providers.component';
import { ItemsComponent } from './component/items/items.component';
import { RequestsComponent } from './component/requests/requests.component';
import { OrdersComponent } from './component/requests/orders/orders.component';

export const topazRoutes: Routes = [
    { path: 'locations', component: LocationsComponent },
    { path: 'areas', component: AreasComponent },
    { path: 'providers', component: ProvidersComponent },
    { path: 'items', component: ItemsComponent },
    { path: 'requests', component: RequestsComponent },
    { path: 'orders', component: OrdersComponent }
];