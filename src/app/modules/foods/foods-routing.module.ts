import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FoodListComponent } from './food-list/food-list.component';
import { FoodFormComponent } from './food-form/food-form.component';
import { permissionGuard } from '../../core/guards/permission.guard';

const routes: Routes = [
  { path: '', component: FoodListComponent },
  { 
    path: 'new', 
    component: FoodFormComponent,
    canActivate: [permissionGuard],
    data: { module: 'foods', action: 'create' }
  },
  { 
    path: 'edit/:id', 
    component: FoodFormComponent,
    canActivate: [permissionGuard],
    data: { module: 'foods', action: 'update' }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FoodsRoutingModule { }
