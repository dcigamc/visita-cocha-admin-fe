import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FoodListComponent } from './food-list/food-list.component';
import { FoodFormComponent } from './food-form/food-form.component';

const routes: Routes = [
  { path: '', component: FoodListComponent },
  { path: 'new', component: FoodFormComponent },
  { path: 'edit/:id', component: FoodFormComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FoodsRoutingModule { }
