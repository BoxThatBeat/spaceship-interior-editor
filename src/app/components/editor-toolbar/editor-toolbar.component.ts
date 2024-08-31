import { Component, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonToggleChange, MatButtonToggleModule } from '@angular/material/button-toggle';
import { EditorTool } from '../../models/editor-tool.enum';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-editor-toolbar',
  standalone: true,
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, MatButtonToggleModule, NgClass],
  templateUrl: './editor-toolbar.component.html',
  styleUrl: './editor-toolbar.component.scss',
})
export class EditorToolbarComponent {
  EditorTool: typeof EditorTool = EditorTool;

  currentTool: EditorTool = EditorTool.NONE;

  // OUTPUTS
  currentToolChanged = output<EditorTool>();
  gridToggleChange = output<boolean>();
  undoEdit = output<void>();
  redoEdit = output<void>();
  clearEditor = output<void>();

  public onSelectedToolChange(toggleChange: MatButtonToggleChange): void {
    const tool = toggleChange.value as EditorTool;
    this.currentTool = tool;
    this.currentToolChanged.emit(tool);
  }

  public onUndo(): void {
    this.undoEdit.emit();
  }

  public onRedo(): void {
    this.redoEdit.emit();
  }

  public onGridToggleChange(event: MatButtonToggleChange): void {
    this.gridToggleChange.emit(event.source.checked as boolean);
  }

  public onClear(): void {
    //warn user before clearing
    if (confirm('Are you sure you want to clear the current design?')) {
      this.clearEditor.emit();
    }
  }
}
