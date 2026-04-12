import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';

// PrimeNG 21
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';
import { TabsModule } from 'primeng/tabs';
import { SelectModule } from 'primeng/select';
import { DividerModule } from 'primeng/divider';
import { DialogModule } from 'primeng/dialog';
import { ImageModule } from 'primeng/image';
import { AutoCompleteModule } from 'primeng/autocomplete';

import { FoodsRoutingModule } from './foods-routing.module';
import { FoodListComponent } from './food-list/food-list.component';
import { FoodFormComponent } from './food-form/food-form.component';

@NgModule({
  declarations: [
    FoodListComponent,
    FoodFormComponent
  ],
  imports: [
    CommonModule,
    FoodsRoutingModule,
    SharedModule,
    TableModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    TextareaModule,
    InputNumberModule,
    ToggleSwitchModule,
    TooltipModule,
    TabsModule,
    SelectModule,
    DividerModule,
    DialogModule,
    ImageModule,
    AutoCompleteModule
  ]
})
export class FoodsModule { }
