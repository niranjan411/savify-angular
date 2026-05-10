import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStateService } from '../../services/app-state';

@Component({
  selector: 'app-fab',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './fab.html',
  styleUrl: './fab.scss'
})
export class FabComponent {
  state = inject(AppStateService);
}
