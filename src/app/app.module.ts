import { WebglComponent } from './webgl/webgl.component';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from "@angular/common/http";

import { AppRoutingModule, routingComponents } from './app-routing.module';
import { AppComponent } from './app.component';
import { TestComponent } from './test/test.component';
import { StructureComponent } from './structure/structure.component';
import { InteractionComponent } from './interaction/interaction.component';
import { PipesComponent } from './pipes/pipes.component';
import { EmployeeService } from './service/employee.service';

@NgModule({
  declarations: [
    AppComponent,
    TestComponent,
    StructureComponent,
    InteractionComponent,
    PipesComponent,
    routingComponents,
    WebglComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule
  ],
  providers: [EmployeeService],
  bootstrap: [AppComponent]
})
export class AppModule { }
