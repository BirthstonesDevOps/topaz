import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { topazRoutes } from './app/topaz/topaz.routes';

export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
        children: [
            ...topazRoutes
        ]
    },
    { path: '**', redirectTo: '/notfound' }
];
