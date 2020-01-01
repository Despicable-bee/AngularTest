import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { EmployeeList } from "./service/employeeList.component";
import { EmployeeDetail } from "./service/employeeDetail.component";
import { PageNotFoundComponent } from "./page-not-found/page-not-found.component";

const routes: Routes = [
  {path: "", redirectTo: "/departments", pathMatch: 'full'},
  { path: "departments", component: EmployeeDetail },
  { path: "employees", component: EmployeeList },
  { path: "**", component: PageNotFoundComponent } // Wildcard router
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
export const routingComponents = [
  EmployeeDetail,
  EmployeeList,
  PageNotFoundComponent
]
