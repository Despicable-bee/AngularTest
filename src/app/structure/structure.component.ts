import { Component, OnInit } from "@angular/core";

/**
 * Setting ngIf to false will remove the HTML element from the DOM
 * (You can't see it when you hit 'inspect').
 */
@Component({
  selector: "[app-structure]",
  template: `
    <h2 *ngIf="displayName; else elseBlock">
      Something
    </h2>
    <ng-template #elseBlock>
      <h2>
        Name is hidden
      </h2>
    </ng-template>

    <div *ngIf="displayName; then thenBlock; else elseBlock2"></div>

    <ng-template #thenBlock>
      <h2>Harry is here</h2>
    </ng-template>
    <ng-template #elseBlock2>
      <h2>Hidden</h2>
    </ng-template>
    <div [ngSwitch]="color">
      <div *ngSwitchCase="'red'">You picked red color</div>
      <div *ngSwitchCase="'blue'">You picked blue color</div>
      <div *ngSwitchCase="'green'">You picked green color</div>
      <div *ngSwitchDefault>Pick again</div>
    </div>
    <div
      *ngFor="
        let color of colors;
        index as i;
        first as f;
        last as l;
        odd as o;
        even as e
      "
    >
      <h2>
        Index:{{ i }}, color:{{ color }}, even:{{ f }}, last:{{ l }}, odd:{{
          o
        }}, even:{{ e }}
      </h2>
    </div>
  `,
  styles: []
})
export class StructureComponent implements OnInit {
  constructor() {}
  displayName = true; // Change this to play with the if else block
  public color = "blue";
  public colors = ["red", "blue", "green", "yellow"];
  ngOnInit() {}
}
