import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CategoryListComponent } from './category-list/category-list.component';
import { permissionGuard } from '../../core/guards/permission.guard';

const routes: Routes = [
  {
    path: '',
    component: CategoryListComponent,
    canActivate: [permissionGuard],
    data: { module: 'categories', action: 'read' }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CategoriesRoutingModule { }
