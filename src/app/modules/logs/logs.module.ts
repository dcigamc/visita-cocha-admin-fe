import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';

// PrimeNG 21
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';

import { LogsRoutingModule } from './logs-routing.module';
import { LogListComponent } from './log-list/log-list.component';

@NgModule({
  declarations: [
    LogListComponent
  ],
  imports: [
    CommonModule,
    LogsRoutingModule,
    SharedModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    TooltipModule,
    DialogModule
  ]
})
export class LogsModule { }
