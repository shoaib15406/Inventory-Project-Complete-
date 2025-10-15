import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProductListComponent } from './product-list/product-list';

const routes: Routes = [
  {
    path: '',
    component: ProductListComponent
  },
  {
    path: 'add',
    loadComponent: () => import('./add-product/add-product').then(c => c.AddProductComponent)
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./edit-product/edit-product').then(c => c.EditProductComponent)
  },
  {
    path: 'view/:id',
    loadComponent: () => import('./view-product/view-product').then(c => c.ViewProductComponent)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProductsRoutingModule { }
