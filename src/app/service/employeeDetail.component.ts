import { Component, OnInit } from "@angular/core";
import { EmployeeService } from "./employee.service";

@Component({
  selector: "app-employeeDetail",
  template: `
    <h2>Employee Details</h2>
    <h3>{{ errorMsg }}</h3>
    <ul *ngFor="let employee of employees">
      <li>{{ employee.id }}, {{ employee.name }}, {{ employee.age }}</li>
    </ul>
  `,
  styles: []
})
export class EmployeeDetail implements OnInit {
  public employees = []; // Empty array
  public errorMsg;
  constructor(private _employeeService: EmployeeService) {}
  /**
   * ng lifecycle hook (gets called once the component has
   * initialised).
   */
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