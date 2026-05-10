import { Component, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStateService } from '../../services/app-state';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class HeaderComponent {
  state = inject(AppStateService);
}