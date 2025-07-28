import { Routes } from '@angular/router';
import { Departments } from './component/departments/departments';
import { AreasComponent } from './component/areas/areas.component';

export const topazRoutes: Routes = [
    { path: 'departments', component: Departments },
    { path: 'areas', component: AreasComponent }
];