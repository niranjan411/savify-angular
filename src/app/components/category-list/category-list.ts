import { Component, inject, computed, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AppStateService } from '../../services/app-state';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './category-list.html',
  styleUrl: './category-list.scss'
})
export class CategoryListComponent implements OnInit {
  state = inject(AppStateService);
  private route = inject(ActivatedRoute);

  itemSearch = '';
  showAddModal = false;
  newTitle = '';
  newData = '';

  filteredItems = computed(() => {
    const q = this.itemSearch.toLowerCase();
    if (!q) return this.state.itemsForCategory();
    return this.state.itemsForCategory().filter(i =>
      i.title.toLowerCase().includes(q) || i.data.toLowerCase().includes(q)
    );
  });

  ngOnInit() {
    const catId = this.route.snapshot.paramMap.get('id');
    if (catId) {
      this.state.selectedCategoryId.set(catId);
      this.state.fetchItems(catId);
    }
  }

  openItem(itemId: string) { this.state.openItem(itemId); }

  openAddModal() {
    this.newTitle = '';
    this.newData = '';
    this.showAddModal = true;
  }

  closeAddModal() { this.showAddModal = false; }

  saveItem() {
    if (!this.newTitle.trim()) return;
    const catId = this.state.selectedCategoryId()!;
    this.state.addItem({ title: this.newTitle.trim(), data: this.newData.trim(), categoryId: catId });
    this.closeAddModal();
  }

  getPreview(data: string): string {
    const first = data.split('\n')[0];
    return first.length > 48 ? first.slice(0, 48) + '…' : first;
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }

  getLastUpdated(): string {
    const items = this.state.itemsForCategory();
    if (!items.length) return 'never';
    const latest = items.reduce((a, b) => a.updatedAt > b.updatedAt ? a : b);
    return this.formatDate(latest.updatedAt);
  }
}