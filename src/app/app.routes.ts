import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login';
import { MainLayoutComponent } from './shared/layout/main-layout/main-layout';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard-module').then(m => m.DashboardModule)
      },
      {
        path: 'products',
        loadChildren: () => import('./features/products/products-module').then(m => m.ProductsModule)
      },
      {
        path: 'inventory',
        loadChildren: () => import('./features/inventory/inventory-module').then(m => m.InventoryModule)
      },
      {
        path: 'suppliers',
        loadChildren: () => import('./features/suppliers/suppliers-module').then(m => m.SuppliersModule)
      },
      {
        path: 'reports',
        loadChildren: () => import('./features/reports/reports-module').then(m => m.ReportsModule)
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
