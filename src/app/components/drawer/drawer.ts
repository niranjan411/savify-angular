import { Component, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStateService } from '../../services/app-state';

@Component({
  selector: 'app-drawer',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './drawer.html',
  styleUrl: './drawer.scss'
})
export class DrawerComponent {
  state = inject(AppStateService);
}