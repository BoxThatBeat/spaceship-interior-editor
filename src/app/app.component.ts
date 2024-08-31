import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ShipEditorComponent } from './components/ship-editor/ship-editor.component';
import { EditorToolbarComponent } from './components/editor-toolbar/editor-toolbar.component';
import { EditorTool } from './models/editor-tool.enum';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ShipEditorComponent, EditorToolbarComponent, MatIconModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  public currentTool: EditorTool = EditorTool.NONE;

  public gridEnabled: boolean = true;
  public editorWidth: number = 1000;
  public editorHeight: number = 1000;
  public gridBlockSize: number = 100;

  public onToolChange(tool: EditorTool): void {
    this.currentTool = tool;
  }

  public onGridToggleChange(value: boolean): void {
    this.gridEnabled = value;
  }
}
