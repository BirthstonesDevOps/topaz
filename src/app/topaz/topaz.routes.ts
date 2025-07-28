import { Routes } from '@angular/router';
import { LocationsComponent } from './component/locations/locations.component';
import { AreasComponent } from './component/areas/areas.component';
import { ProvidersComponent } from './component/providers/providers.component';
import { ItemsComponent } from './component/items/items.component';

export const topazRoutes: Routes = [
    { path: 'departments', component: LocationsComponent },
    { path: 'areas', component: AreasComponent },
    { path: 'providers', component: ProvidersComponent },
    { path: 'items', component: ItemsComponent }
];