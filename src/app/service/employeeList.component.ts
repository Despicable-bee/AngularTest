import { Component, OnInit } from "@angular/core";
import { EmployeeService } from "./employee.service";

@Component({
  selector: "app-employeeList",
  template: `
    <h2>Employee List</h2>
    <h3>{{ errorMsg }}</h3>
    <ul *ngFor="let employee of employees">
      <li>{{ employee.name }}</li>
    </ul>
  `,
  styles: []
})
export class EmployeeList implements OnInit {
  public employees = [];
  public errorMsg;
  constructor(private _employeeService: EmployeeService) {}
  ngOnInit() {
    // Observable returned, we subscribe in order to recieve data.
    // We assign data to class variable 'employees' with the fat arrow
    // syntax.
    this._employeeService
      .getEmployees()
      .subscribe(
        data => (this.employees = data),
        error => (this.errorMsg = error)
      );
  }
}