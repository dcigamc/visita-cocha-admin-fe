import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AttractiveListComponent } from './attractive-list/attractive-list.component';
import { AttractiveFormComponent } from './attractive-form/attractive-form.component';

const routes: Routes = [
  { path: '', component: AttractiveListComponent },
  { path: 'new', component: AttractiveFormComponent },
  { path: 'edit/:id', component: AttractiveFormComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AttractivesRoutingModule { }
