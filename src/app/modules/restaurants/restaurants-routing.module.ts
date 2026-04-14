import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RestaurantListComponent } from './restaurant-list/restaurant-list.component';
import { RestaurantFormComponent } from './restaurant-form/restaurant-form.component';
import { permissionGuard } from '../../core/guards/permission.guard';

const routes: Routes = [
  { path: '', component: RestaurantListComponent },
  { 
    path: 'new', 
    component: RestaurantFormComponent,
    canActivate: [permissionGuard],
    data: { module: 'restaurants', action: 'create' }
  },
  { 
    path: 'edit/:id', 
    component: RestaurantFormComponent,
    canActivate: [permissionGuard],
    data: { module: 'restaurants', action: 'update' }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RestaurantsRoutingModule { }
