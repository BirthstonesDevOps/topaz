import { Injectable, inject } from '@angular/core';
import { ItemService, ItemDetailsResponseModel } from '@birthstonesdevops/topaz.backend.itemsservice';

@Injectable({ providedIn: 'root' })
export class ItemCacheService {
  private readonly LOCAL_STORAGE_KEY = 'allItemsCache';
  private itemService = inject(ItemService);

  private saveItemsToLocalStorage(items: ItemDetailsResponseModel[]) {
    const mapped = items.map(item => ({ ...item, description: item.description ?? '' }));
    localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(mapped));
  }

  /**
   * Public wrapper to persist items to localStorage with a safe try/catch.
   * Use this from components/services instead of calling localStorage directly.
   */
  saveItems(items: ItemDetailsResponseModel[] | undefined | null): void {
    if (!items || !Array.isArray(items)) return;
    try {
      this.saveItemsToLocalStorage(items);
    } catch (e) {
      // Ignore storage errors (quota, disabled storage, etc.)
      console.warn('Could not save items to localStorage', e);
    }
  }

  async cacheAllItems(): Promise<void> {
    try {
      const allItems = await this.itemService.itemGetAllItemsDetails().toPromise();
      if (allItems && Array.isArray(allItems)) {
        this.saveItemsToLocalStorage(allItems);
      }
    } catch (error) {
      // Optionally handle error
      console.error('Error caching all items on app init:', error);
    }
  }

  clearItemsCache(): void {
    localStorage.removeItem(this.LOCAL_STORAGE_KEY);
  }
}
