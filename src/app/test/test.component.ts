import { Component, OnInit } from "@angular/core";

@Component({
  selector: "[app-test]",
  template: `
    <div>Welcome {{ name }}</div>
    <div>
      {{ 2 + 2 }}
    </div>
    <div>
      {{ "Welcome " + name }}
    </div>
    <div>
      {{ "Your name is " + name.length + " characters long" }}
    </div>
    <div>
      {{ "Your name in uppercase is " + name.toUpperCase() }}
    </div>
    <div>
      {{ greetUser() }}
    </div>
    <div>
      You can't make assignments with curly braces, nor can you access global
      javascript variables (e.g. window.location.href needs to be accessed in
      the class)
    </div>
    <div>
      {{ siteUrl }}
    </div>
    <input
      bind-disabled="isDisabled"
      id="{{ myId }}"
      type="text"
      value="Harry"
    />
    <div>
      <h2 [class]="successClass">class binding example</h2>
      <h2 [class.text-danger]="hasError">Error</h2>
      <h2 [ngClass]="messageClasses">A class checking thing</h2>
      <h2 [style.color]="hasError ? 'red' : 'green'">Style binding</h2>
      <h2 [style.color]="highlightColor">Style binding 2</h2>
      <h2 [ngStyle]="titleStyles">Style binding 3</h2>
    </div>
    <div>
      <h2>Event binding</h2>
      <button (click)="onClick($event)">Greet</button>
      <button (click)="greeting = 'welcome boi'">Greet 2</button>
      {{ greeting }}
    </div>
    <div>
      <h2>Template reference variables</h2>
      <input #myInput type="text" />
      <button (click)="logMessage(myInput.value)">Log</button>
    </div>
    <div>
      <h2>Two Way Binding</h2>
      <input [(ngModel)]="name2" type="text" />
      {{ name2 }}
    </div>
  `, // Example of an Inline template (good for understanding)
  // [] = property binding (data flow from class to template)
  // () = data binding (data frlow from template to class)
  styles: [
    `
      div {
        color: blue;
      }
      .text-success {
        color: green;
      }
      .text-danger {
        color: red;
      }
      .text-special {
        font-style: italic;
      }
    `
  ] // Example of inline styling (doing css here rather than a separate file)
})
export class TestComponent implements OnInit {
  public name = "Harry";
  public myId = "testId";
  public isDisabled = true;
  public successClass = "text-success";
  public siteUrl = window.location.href;
  public hasError = true;
  public isSpecial = true;
  public highlightColor = "orange";
  public greeting = "";
  public titleStyles = {
    color: "blue",
    fontStyle: "italic"
  };
  public messageClasses = {
    "text-success": !this.hasError,
    "text-danger": this.hasError,
    "text-special": this.isSpecial
  }; // Class bindings are useful as they allow you to dynamically add or remove classes based on
  //  class properties, user interactions or state of application.

  public name2 = "";
  constructor() {}

  ngOnInit() {}

  greetUser() {
    return "Hello " + this.name;
  }

  onClick(event) {
    console.log(event);
    this.greeting = event.type;
  }

  logMessage(value) {
    console.log(value);
  }
}