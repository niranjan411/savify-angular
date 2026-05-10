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

  // UI STATE
  drawerOpen = signal(false);
  modalOpen = signal(false);
  darkMode = signal(false);
  searchQuery = signal('');
  toasts = signal<{ id: string; message: string; type: string }[]>([]);
  selectedCategoryId = signal<string | null>(null);
  selectedItemId = signal<string | null>(null);
  isLoadingItems = signal(false);

  // ✅ KEEP STATIC CATEGORIES (IMPORTANT)
  categories = signal<Category[]>([
    { id: 'passwords', name: 'Passwords', icon: 'lock-closed', color: '#FF6B35', bgColor: '#FFF0EA', count: 0, subtitle: 'Logins & Secrets' },
    { id: 'notes', name: 'Notes', icon: 'document-text', color: '#6C63FF', bgColor: '#F0EEFF', count: 0, subtitle: 'Notes & Journalism' },
    { id: 'tasks', name: 'Tasks', icon: 'checkmark-done', color: '#2ECC8F', bgColor: '#E8FAF3', count: 0, subtitle: 'To-Do & Projects' },
    { id: 'movies', name: 'Movies', icon: 'film', color: '#E91E8C', bgColor: '#FDE8F4', count: 0, subtitle: 'Watchlist & Reviews' },
    { id: 'travel', name: 'Travel', icon: 'airplane', color: '#00B4D8', bgColor: '#E0F7FC', count: 0, subtitle: 'Trips & Itineraries' },
    { id: 'books', name: 'Books', icon: 'book', color: '#F4A261', bgColor: '#FEF3E8', count: 0, subtitle: 'Reading List' },
    { id: 'recipes', name: 'Recipes', icon: 'restaurant', color: '#E76F51', bgColor: '#FDEEE9', count: 0, subtitle: 'Cooking & Meals' },
    { id: 'fitness', name: 'Fitness', icon: 'barbell', color: '#4CC9F0', bgColor: '#E8F8FE', count: 0, subtitle: 'Workouts & Health' },
  ]);

  items = signal<Item[]>([]);

  // COMPUTED
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

  // NAVIGATION
  openCategory(categoryId: string) {
    this.selectedCategoryId.set(categoryId);
    this.router.navigate(['/category', categoryId]);
    this.fetchItems(categoryId); // 🔥 fetch on open
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

  // API CALLS

  // GET ITEMS
  fetchItems(categoryId: string) {
    this.isLoadingItems.set(true);

    this.http.get<Item[]>(`${API_BASE}/categories/${categoryId}/items`).pipe(
      catchError(() => of([]))
    ).subscribe(data => {
      this.isLoadingItems.set(false);

      // Replace items of that category
      this.items.update(all => [
        ...all.filter(i => i.categoryId !== categoryId),
        ...data
      ]);

      // 🔥 Update count automatically
      this.updateCategoryCount(categoryId);
    });
  }

  // ADD ITEM
  addItem(item: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) {
    this.http.post<Item>(`${API_BASE}/categories/${item.categoryId}/items`, item).pipe(
      catchError(() => of(null))
    ).subscribe(saved => {
      if (!saved) return this.showToast('Failed to save', 'default');

      this.items.update(all => [saved, ...all]);
      this.updateCategoryCount(item.categoryId);

      this.showToast('Item saved!', 'success');
      this.closeModal();
    });
  }

  // UPDATE ITEM
  updateItem(itemId: string, changes: Partial<Pick<Item, 'title' | 'data'>>) {
    const current = this.items().find(i => i.id === itemId);
    if (!current) return;

    this.http.put<Item>(
      `${API_BASE}/categories/${current.categoryId}/items/${itemId}`,
      changes
    ).pipe(
      catchError(() => of(null))
    ).subscribe(updated => {
      if (!updated) return this.showToast('Update failed');

      this.items.update(all =>
        all.map(i => i.id === itemId ? updated : i)
      );

      this.showToast('Updated', 'success');
    });
  }

  // DELETE ITEM
  deleteItem(itemId: string) {
    const item = this.items().find(i => i.id === itemId);
    if (!item) return;

    this.http.delete(`${API_BASE}/categories/${item.categoryId}/items/${itemId}`).pipe(
      catchError(() => of(null))
    ).subscribe(() => {
      this.items.update(all => all.filter(i => i.id !== itemId));
      this.updateCategoryCount(item.categoryId);

      this.showToast('Item deleted');
      this.goBackToCategory();
    });
  }

  // 🔥 IMPORTANT HELPER (AUTO COUNT FIX)
  private updateCategoryCount(categoryId: string) {
    const count = this.items().filter(i => i.categoryId === categoryId).length;

    this.categories.update(cats =>
      cats.map(c =>
        c.id === categoryId ? { ...c, count } : c
      )
    );
  }

  // UI HELPERS
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
    setTimeout(() => {
      this.toasts.update(t => t.filter(x => x.id !== id));
    }, 3000);
  }
}