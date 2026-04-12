import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';
import { MainLayoutComponent } from './shared/components/layout/main-layout.component';

const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./modules/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('./modules/dashboard/dashboard.module').then(m => m.DashboardModule)
      },
      {
        path: 'users',
        loadChildren: () => import('./modules/users/users.module').then(m => m.UsersModule),
        canActivate: [permissionGuard],
        data: { module: 'users', action: 'read' }
      },
      {
        path: 'attractives',
        loadChildren: () => import('./modules/attractives/attractives.module').then(m => m.AttractivesModule),
        canActivate: [permissionGuard],
        data: { module: 'attractives', action: 'read' }
      },
      {
        path: 'restaurants',
        loadChildren: () => import('./modules/restaurants/restaurants.module').then(m => m.RestaurantsModule),
        canActivate: [permissionGuard],
        data: { module: 'restaurants', action: 'read' }
      },
      {
        path: 'foods',
        loadChildren: () => import('./modules/foods/foods.module').then(m => m.FoodsModule),
        canActivate: [permissionGuard],
        data: { module: 'foods', action: 'read' }
      },
      {
        path: 'events',
        loadChildren: () => import('./modules/events/events.module').then(m => m.EventsModule),
        canActivate: [permissionGuard],
        data: { module: 'events', action: 'read' }
      },
      {
        path: 'logs',
        loadChildren: () => import('./modules/logs/logs.module').then(m => m.LogsModule),
        canActivate: [permissionGuard],
        data: { module: 'logs', action: 'read' }
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'auth' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
