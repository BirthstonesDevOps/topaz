import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';
import { environment } from '../../environments/environment';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        <ng-container *ngFor="let item of model; let i = index">
            <li app-menuitem *ngIf="!item.separator" [item]="item" [index]="i" [root]="true"></li>
            <li *ngIf="item.separator" class="menu-separator"></li>
        </ng-container>
    </ul> `
})
export class AppMenu {
    model: MenuItem[] = [];

    ngOnInit() {
        this.model = [
            {
                label: 'Pedidos',
                items: [
                    { label: 'Pedidos', icon: 'pi pi-fw pi-shopping-cart', routerLink: ['/requests'] },
                    { label: 'Ordenes de compra', icon: 'pi pi-fw pi-file', routerLink: ['/orders'] }
                ]
            },
            {
                label: 'Organización',
                items: [
                    { label: 'Departamentos', icon: 'pi pi-fw pi-sitemap', routerLink: ['/areas'] },
                    { label: 'Centros de producción', icon: 'pi pi-fw pi-building', routerLink: ['/locations'] },
                    { label: 'Proveedores', icon: 'pi pi-fw pi-truck', routerLink: ['/providers'] }
                ]
            },

            {
                label: 'Productos',
                items: [
                    { label: 'Items', icon: 'pi pi-fw pi-box', routerLink: ['/items'] },
                    { label: 'Categorías', icon: 'pi pi-fw pi-tags', routerLink: ['/categories'] }
                ]
            }
        ];
    }
}
