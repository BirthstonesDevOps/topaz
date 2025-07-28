import { Routes } from '@angular/router';
import { LocationsComponent } from './component/locations/locations.component';
import { AreasComponent } from './component/areas/areas.component';

export const topazRoutes: Routes = [
    { path: 'departments', component: LocationsComponent },
    { path: 'areas', component: AreasComponent }
];