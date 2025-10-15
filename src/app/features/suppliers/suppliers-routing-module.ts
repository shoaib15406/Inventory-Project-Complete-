import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SupplierListComponent } from './supplier-list/supplier-list';
import { AddSupplierComponent } from './add-supplier/add-supplier';
import { EditSupplierComponent } from './edit-supplier/edit-supplier';

const routes: Routes = [
  {
    path: '',
    component: SupplierListComponent
  },
  {
    path: 'add',
    component: AddSupplierComponent
  },
  {
    path: ':id/edit',
    component: EditSupplierComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SuppliersRoutingModule { }
