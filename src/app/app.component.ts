import { ChangeDetectionStrategy, Component, OnInit, viewChild } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  editorComponent = viewChild.required(ShipEditorComponent);

  public currentTool: EditorTool = EditorTool.NONE;
  public currentlyHeldShipElement: ShipElement | undefined = undefined;

  public gridEnabled: boolean = true;
  public editorWidth: number = 1000; //TODO: make this be based on the available space using bounding box
  public editorHeight: number = 500; 
  public gridBlockSize: number = 300; // 300px per block gives enough detail for images in a square
  public gridWidth: number = 22;
  public gridHeight: number = 11;
  public shipDoorWidth: number = 30;
  public shipDoorHeight: number = 200;
  public initialStageScale: number = 0.15;
  public zoomScaleBy: number = 1.05;
  public shipElements: ShipElement[] = shipElementsJson as ShipElement[];

  public onToolChange(tool: EditorTool): void {
    this.currentTool = tool;
  }

  public onGridToggleChange(value: boolean): void {
    this.gridEnabled = value;
  }

  public onExportShip(): void {
    this.editorComponent().exportShip();
  }

  public onSaveDesign(): void {
    this.editorComponent().saveDesign();
  }

  public onLoadDesign(jsonState: string): void {
    this.editorComponent().loadDesign(jsonState);
  }

  public onClearGrid(): void {
    this.editorComponent().clearEditor();
  }

  public onHeldShipElementChanged(shipElement: ShipElement): void {
    this.currentlyHeldShipElement = shipElement;
  }
}
