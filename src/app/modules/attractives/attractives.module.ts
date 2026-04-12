import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';

// PrimeNG 21
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';

import { AttractivesRoutingModule } from './attractives-routing.module';
import { AttractiveListComponent } from './attractive-list/attractive-list.component';

@NgModule({
  declarations: [
    AttractiveListComponent
  ],
  imports: [
    CommonModule,
    AttractivesRoutingModule,
    SharedModule,
    TableModule,
    ButtonModule,
    CardModule,
    InputTextModule
  ]
})
export class AttractivesModule { }
