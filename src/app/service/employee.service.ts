import { Injectable } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { IEmployee } from "../employee";
import { Observable, throwError } from "rxjs";
import {catchError, retry} from 'rxjs/operators';


/**
 * Typically it is best to register the service
 * at the module level
 */

@Injectable() // <-- Necessary when this service has dependencies as well
export class EmployeeService {
  private _url: string = "/assets/data/employees.json";

  constructor(private http: HttpClient) {}

  // Cast the observable to an employee array
  getEmployees(): Observable<IEmployee[]> {
    return this.http.get<IEmployee[]>(this._url)
        .pipe(
            retry(1),
            catchError(this.errorHandler)
        );
  }

  errorHandler(error: HttpErrorResponse) {
    return throwError(error.message || "Server error");
  }
}