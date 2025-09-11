import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItemCacheService } from './app/services/item-cache.service';
import { RouterModule } from '@angular/router';

@Component({
        selector: 'app-root',
        standalone: true,
        imports: [CommonModule, RouterModule],
        template: `
            <div *ngIf="loading()" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(255,255,255,0.7); z-index: 9999; display: flex; align-items: center; justify-content: center;">
                <div class="spinner" style="border: 8px solid #f3f3f3; border-top: 8px solid #3498db; border-radius: 50%; width: 60px; height: 60px; animation: spin 1s linear infinite;"></div>
            </div>
            <router-outlet></router-outlet>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `
})
export class AppComponent implements OnInit {
        private itemCacheService = inject(ItemCacheService);
        loading = signal(true);

        async ngOnInit(): Promise<void> {
                this.loading.set(true);
                await this.itemCacheService.cacheAllItems();
                this.loading.set(false);
        }
}
