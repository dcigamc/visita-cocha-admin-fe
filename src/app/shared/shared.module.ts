import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HasPermissionDirective } from './directives/has-permission.directive';

@NgModule({
  declarations: [
    HasPermissionDirective
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HasPermissionDirective
  ]
})
export class SharedModule { }
