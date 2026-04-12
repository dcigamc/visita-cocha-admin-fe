import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { HasPermissionDirective } from './directives/has-permission.directive';
import { MainLayoutComponent } from './components/layout/main-layout.component';

@NgModule({
  declarations: [
    HasPermissionDirective,
    MainLayoutComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ButtonModule
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    HasPermissionDirective,
    MainLayoutComponent
  ]
})
export class SharedModule { }
