import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';

export interface Category {
    id: string;
    name: string;
    icon: string;
    color: string;
    bgColor: string;
    count: number;
    subtitle: string;
}

export interface Item {
    id: string;
    title: string;
    data: string;
    categoryId: string;
    createdAt: string;
    updatedAt: string;
}

export interface DrawerItem {
    icon: string;
    label: string;
    route?: string;
}

const API_BASE = 'http://localhost:8084/api';

@Injectable({ providedIn: 'root' })
export class AppStateService {
    private http = inject(HttpClient);
    private router = inject(Router);

    drawerOpen = signal(false);
    modalOpen = signal(false);
    darkMode = signal(false);
    searchQuery = signal('');
    toasts = signal<{ id: string; message: string; type: string }[]>([]);
    selectedCategoryId = signal<string | null>(null);
    selectedItemId = signal<string | null>(null);
    isLoadingItems = signal(false);
    isLoadingCategories = signal(false);

    categories = signal<Category[]>([]);
    items = signal<Item[]>([]);

    filteredCategories = computed(() => {
        const q = this.searchQuery().toLowerCase();
        if (!q) return this.categories();
        return this.categories().filter(c => c.name.toLowerCase().includes(q));
    });

    itemsForCategory = computed(() => {
        const catId = this.selectedCategoryId();
        if (!catId) return [];
        return this.items().filter(i => i.categoryId === catId);
    });

    selectedCategory = computed(() =>
        this.categories().find(c => c.id === this.selectedCategoryId()) ?? null
    );

    selectedItem = computed(() =>
        this.items().find(i => i.id === this.selectedItemId()) ?? null
    );

    drawerItems: DrawerItem[] = [
        { icon: 'shield-checkmark', label: 'Privacy Policy' },
        { icon: 'document', label: 'Terms & Conditions' },
        { icon: 'information-circle', label: 'About' },
        { icon: 'settings', label: 'Settings' },
        { icon: 'chatbubble-ellipses', label: 'Help / Support' },
    ];

    // Navigation
    openCategory(categoryId: string) {
        this.selectedCategoryId.set(categoryId);
        this.router.navigate(['/category', categoryId]);
    }

    openItem(itemId: string) {
        this.selectedItemId.set(itemId);
        const catId = this.selectedCategoryId();
        this.router.navigate(['/category', catId, 'item', itemId]);
    }

    goBack() { this.router.navigate(['/']); }

    goBackToCategory() {
        const catId = this.selectedCategoryId();
        this.router.navigate(['/category', catId]);
    }

    // GET /api/categories
    fetchCategories() {
        this.isLoadingCategories.set(true);
        this.http.get<Category[]>(`${API_BASE}/categories`).pipe(
            catchError(() => of(null))
        ).subscribe(data => {
            this.isLoadingCategories.set(false);
            if (data) this.categories.set(data);
        });
    }

    // GET /api/categories/:categoryId/items
    fetchItems(categoryId: string) {
        this.isLoadingItems.set(true);
        this.http.get<Item[]>(`${API_BASE}/categories/${categoryId}/items`).pipe(
            catchError(() => of(null))
        ).subscribe(data => {
            this.isLoadingItems.set(false);
            if (data) {
                this.items.update(all => [
                    ...all.filter(i => i.categoryId !== categoryId),
                    ...data
                ]);
            }
        });
    }

    // POST /api/categories/:categoryId/items
    addItem(item: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) {
        const payload = {
            title: item.title,
            data: item.data,
            categoryId: item.categoryId
        };
        this.http.post<Item>(`${API_BASE}/categories/${item.categoryId}/items`, payload).pipe(
            catchError(() => of(null))
        ).subscribe(saved => {
            if (saved) {
                this.items.update(all => [saved, ...all]);
                this.categories.update(cats =>
                    cats.map(c => c.id === item.categoryId ? { ...c, count: c.count + 1 } : c)
                );
                this.showToast('Item saved!', 'success');
            } else {
                this.showToast('Failed to save item', 'default');
            }
        });
    }

    // PUT /api/categories/:categoryId/items/:id
    updateItem(itemId: string, changes: Partial<Pick<Item, 'title' | 'data'>>) {
        const current = this.items().find(i => i.id === itemId);
        if (!current) return;

        const payload: Item = {
            ...current,
            ...changes,
            updatedAt: new Date().toISOString()
        };

        this.http.put<Item>(
            `${API_BASE}/categories/${current.categoryId}/items/${itemId}`,
            payload
        ).pipe(
            catchError(() => of(null))
        ).subscribe(updated => {
            if (updated) {
                this.items.update(all => all.map(i => i.id === itemId ? updated : i));
                this.showToast('Saved', 'success');
            } else {
                this.showToast('Failed to update', 'default');
            }
        });
    }

    // DELETE /api/categories/:categoryId/items/:id
    deleteItem(itemId: string) {
        const item = this.items().find(i => i.id === itemId);
        if (!item) return;

        this.http.delete(`${API_BASE}/categories/${item.categoryId}/items/${itemId}`).pipe(
            catchError(() => of(null))
        ).subscribe(() => {
            this.items.update(all => all.filter(i => i.id !== itemId));
            this.categories.update(cats =>
                cats.map(c => c.id === item.categoryId
                    ? { ...c, count: Math.max(0, c.count - 1) }
                    : c)
            );
            this.showToast('Item deleted', 'default');
            this.goBackToCategory();
        });
    }

    // Helpers
    toggleDrawer() { this.drawerOpen.update(v => !v); }
    closeDrawer() { this.drawerOpen.set(false); }
    toggleModal() { this.modalOpen.update(v => !v); }
    closeModal() { this.modalOpen.set(false); }

    toggleDarkMode() {
        this.darkMode.update(v => !v);
        document.documentElement.setAttribute('data-theme', this.darkMode() ? 'dark' : '');
    }

    showToast(message: string, type = 'default') {
        const id = Date.now().toString();
        this.toasts.update(t => [...t, { id, message, type }]);
        setTimeout(() => this.toasts.update(t => t.filter(x => x.id !== id)), 3000);
    }
}