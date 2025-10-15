import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InventoryOverviewComponent } from './inventory-overview/inventory-overview';

const routes: Routes = [
  {
    path: '',
    component: InventoryOverviewComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InventoryRoutingModule { }
