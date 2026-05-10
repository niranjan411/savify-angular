import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard';
import { CategoryListComponent } from './components/category-list/category-list';
import { ItemDetailComponent } from './components/item-detail/item-detail';

export const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'category/:id', component: CategoryListComponent },
  { path: 'category/:id/item/:itemId', component: ItemDetailComponent },
  { path: '**', redirectTo: '' }
];
