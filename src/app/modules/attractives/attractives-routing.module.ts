import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AttractiveListComponent } from './attractive-list/attractive-list.component';
import { AttractiveFormComponent } from './attractive-form/attractive-form.component';
import { permissionGuard } from '../../core/guards/permission.guard';

const routes: Routes = [
  { path: '', component: AttractiveListComponent },
  { 
    path: 'new', 
    component: AttractiveFormComponent,
    canActivate: [permissionGuard],
    data: { module: 'attractives', action: 'create' }
  },
  { 
    path: 'edit/:id', 
    component: AttractiveFormComponent,
    canActivate: [permissionGuard],
    data: { module: 'attractives', action: 'update' }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AttractivesRoutingModule { }
