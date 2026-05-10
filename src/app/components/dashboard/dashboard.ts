import { Component, inject, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppStateService } from '../../services/app-state';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit {

  state = inject(AppStateService);

  showModal = false;
  newTitle = '';
  newData = '';
  newCategoryId = '';

  // Search binding
  get searchQuery() { return this.state.searchQuery(); }
  set searchQuery(v: string) { this.state.searchQuery.set(v); }

  ngOnInit() {
    // ✅ No need to fetch categories (they are static now)
  }

  openCategory(id: string) {
    this.state.openCategory(id);
  }

  getTotalItems() {
    return this.state.categories().reduce((sum, c) => sum + c.count, 0);
  }

  openAddModal() {
    this.newTitle = '';
    this.newData = '';
    this.newCategoryId = '';
    this.showModal = true;
  }

  closeAddModal() {
    this.showModal = false;
  }

  saveEntry() {
    if (!this.newTitle.trim() || !this.newCategoryId) return;

    this.state.addItem({
      title: this.newTitle.trim(),
      data: this.newData.trim(),
      categoryId: this.newCategoryId
    });

    this.closeAddModal();
  }
}