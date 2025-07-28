import { Routes } from '@angular/router';
import { DepartmentsComponent } from './component/departments/departments.component';
import { AreasComponent } from './component/areas/areas.component';

export const topazRoutes: Routes = [
    { path: 'departments', component: DepartmentsComponent },
    { path: 'areas', component: AreasComponent }
];