import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EventListComponent } from './event-list/event-list.component';
import { EventFormComponent } from './event-form/event-form.component';
import { permissionGuard } from '../../core/guards/permission.guard';

const routes: Routes = [
  { path: '', component: EventListComponent },
  { 
    path: 'new', 
    component: EventFormComponent,
    canActivate: [permissionGuard],
    data: { module: 'events', action: 'create' }
  },
  { 
    path: 'edit/:id', 
    component: EventFormComponent,
    canActivate: [permissionGuard],
    data: { module: 'events', action: 'update' }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EventsRoutingModule { }
