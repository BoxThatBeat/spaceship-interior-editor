import { Component, OnInit, viewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ShipEditorComponent } from './components/ship-editor/ship-editor.component';
import { EditorToolbarComponent } from './components/editor-toolbar/editor-toolbar.component';
import { EditorTool } from './models/editor-tool.enum';
import { MatIconModule } from '@angular/material/icon';
import { SideBarComponent } from './components/side-bar/side-bar.component';
import { ShipElement } from './models/ship-element';
import shipElementsJson from '../assets/ship-elements.json';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    ShipEditorComponent,
    SideBarComponent,
    EditorToolbarComponent,
    MatIconModule,
    SideBarComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  editorComponent = viewChild.required(ShipEditorComponent);

  public currentTool: EditorTool = EditorTool.NONE;
  public currentlyHeldShipElement: ShipElement | undefined = undefined;

  public gridEnabled: boolean = false;
  public editorWidth: number = 1000;
  public editorHeight: number = 1000;
  public gridBlockSize: number = 100;
  public shipElements: ShipElement[] = shipElementsJson as ShipElement[];

  public onToolChange(tool: EditorTool): void {
    this.currentTool = tool;
  }

  public onGridToggleChange(value: boolean): void {
    this.gridEnabled = value;
  }

  public onClearGrid(): void {
    this.editorComponent().clearEditor();
  }

  public onHeldShipElementChanged(shipElement: ShipElement): void {
    this.currentlyHeldShipElement = shipElement;
  }
}
