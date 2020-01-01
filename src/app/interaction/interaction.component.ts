import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";

@Component({
  selector: "app-interaction",
  template: `
    <h2>{{ "Hello " + name }}</h2>
    <button (click)="fireEvent()">Send Event</button>
  `,
  styles: []
})
export class InteractionComponent implements OnInit {
  constructor() {}
  OnInit() {}
  @Input("parentData") public name; // Example of aliasing
  @Output() public childEvent = new EventEmitter();
  fireEvent() {
    this.childEvent.emit("This is a message from child to parent");
  }
  ngOnInit() {}
}
