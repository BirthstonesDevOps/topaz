import { Component, OnInit, inject, signal, ViewEncapsulation, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItemCacheService } from './app/services/item-cache.service';
import { RouterModule } from '@angular/router';
import { UserRolesService } from './app/services/user-roles.service';

@Component({
        selector: 'app-root',
        standalone: true,
        imports: [CommonModule, RouterModule],
        template: `
            <div *ngIf="loading()" class="global-spinner-overlay">
                <div class="global-spinner"></div>
            </div>
            <router-outlet></router-outlet>
        `,
        styles: [
            `.global-spinner-overlay {
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                background: rgba(255,255,255,0.7); z-index: 9999;
                display: flex; align-items: center; justify-content: center;
            }
            .global-spinner {
                border: 8px solid #f3f3f3;
                border-top: 8px solid #3498db;
                border-radius: 50%;
                width: 60px; height: 60px;
                animation: global-spin 1s linear infinite;
            }
            @keyframes global-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            `
        ],
        encapsulation: ViewEncapsulation.None
})
export class AppComponent implements OnInit {
        private itemCacheService = inject(ItemCacheService);
        loading = signal(true);
        userRolesSv = inject(UserRolesService);
        

        async ngOnInit(): Promise<void> {
                this.loading.set(true);
                this.userRolesSv._loadUserRoles();
                //clear cache before caching again
                await this.itemCacheService.clearItemsCache();
                await this.itemCacheService.cacheAllItems();
                this.loading.set(false);
        }
}
