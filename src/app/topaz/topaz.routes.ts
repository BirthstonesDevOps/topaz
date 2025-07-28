import { Routes } from '@angular/router';
import { Departments } from './component/departments/departments';
import { Areas } from './component/areas/areas';

export const topazRoutes: Routes = [
    { path: 'departments', component: Departments },
    { path: 'areas', component: Areas }
];