import { Component, inject, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AppStateService } from '../../services/app-state';

@Component({
  selector: 'app-item-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './item-detail.html',
  styleUrl: './item-detail.scss'
})
export class ItemDetailComponent implements OnInit, OnDestroy {
  state = inject(AppStateService);
  private route = inject(ActivatedRoute);

  editingTitle = false;
  editingData = false;
  editTitle = '';
  editData = '';
  confirmDelete = false;
  savedPulse = false;

  private autoSaveTimer: any = null;

  ngOnInit() {
    const catId = this.route.snapshot.paramMap.get('id');
    const itemId = this.route.snapshot.paramMap.get('itemId');
    if (catId) this.state.selectedCategoryId.set(catId);
    if (itemId) this.state.selectedItemId.set(itemId);

    // Seed edit fields from item
    const item = this.state.selectedItem();
    if (item) {
      this.editTitle = item.title;
      this.editData = item.data;
    }
  }

  ngOnDestroy() {
    if (this.autoSaveTimer) clearTimeout(this.autoSaveTimer);
  }

  startEditTitle() {
    this.editingTitle = true;
  }

  startEditData() {
    this.editingData = true;
  }

  onTitleChange(val: string) {
    this.editTitle = val;
    this.scheduleAutoSave();
  }

  onDataChange(val: string) {
    this.editData = val;
    this.scheduleAutoSave();
  }

  scheduleAutoSave() {
    if (this.autoSaveTimer) clearTimeout(this.autoSaveTimer);
    this.autoSaveTimer = setTimeout(() => this.doSave(), 900);
  }

  doSave() {
    const item = this.state.selectedItem();
    if (!item || !this.editTitle.trim()) return;
    this.state.updateItem(item.id, {
      title: this.editTitle.trim(),
      data: this.editData
    });
    this.savedPulse = true;
    setTimeout(() => this.savedPulse = false, 1800);
  }

  blurTitle() {
    this.editingTitle = false;
    this.doSave();
  }

  blurData() {
    this.editingData = false;
    this.doSave();
  }

  doDelete() {
    const item = this.state.selectedItem();
    if (!item) return;
    this.confirmDelete = false;
    this.state.deleteItem(item.id);
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      this.state.showToast('Copied to clipboard!', 'success');
    }).catch(() => {
      this.state.showToast('Copy failed', 'default');
    });
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  }
}