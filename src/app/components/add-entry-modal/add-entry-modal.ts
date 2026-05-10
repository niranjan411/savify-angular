import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppStateService } from '../../services/app-state';

@Component({
  selector: 'app-add-entry-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-entry-modal.html',
  styleUrl: './add-entry-modal.scss'
})
export class AddEntryModalComponent {
  state = inject(AppStateService);

  title = signal('');
  description = signal('');
  selectedCategory = signal('');

  reset() {
    this.title.set('');
    this.description.set('');
    this.selectedCategory.set('');
  }

  close() { this.state.closeModal(); this.reset(); }

  save() {
    if (!this.title() || !this.selectedCategory()) return;
    this.state.addItem({
      title: this.title(),
      data: this.description(),
      categoryId: this.selectedCategory()
    });
    this.reset();
  }

  isValid() { return this.title().trim() && this.selectedCategory(); }
}