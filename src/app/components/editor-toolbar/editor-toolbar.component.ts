import { Component, output } from '@angular/core';
import { EditorTool } from '../../models/editor-tool.enum';

@Component({
  selector: 'app-editor-toolbar',
  standalone: true,
  imports: [],
  templateUrl: './editor-toolbar.component.html',
  styleUrl: './editor-toolbar.component.scss'
})
export class EditorToolbarComponent {

  currentTool: EditorTool = EditorTool.NONE;

  currentToolChanged = output<EditorTool>();

  public onBrushToggle(): void {
    if (this.currentTool === EditorTool.BRUSH) {
      this.currentTool = EditorTool.NONE;
    } else {
      this.currentTool = EditorTool.BRUSH;
    }
 
    this.currentToolChanged.emit(this.currentTool);
  }

  public onEraserToggle(): void {
    if (this.currentTool === EditorTool.ERASER) {
      this.currentTool = EditorTool.NONE;
    } else {
      this.currentTool = EditorTool.ERASER;
    }
 
    this.currentToolChanged.emit(this.currentTool);
  }
}
