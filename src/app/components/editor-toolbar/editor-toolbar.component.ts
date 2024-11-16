import { Component, HostListener, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonToggleChange, MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EditorTool } from '../../models/editor-tool.enum';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-editor-toolbar',
  standalone: true,
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, MatTooltipModule, MatButtonToggleModule, NgClass],
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
  exportShip = output<void>();
  clearEditor = output<void>();

  changeTool(tool: EditorTool) {
    this.currentTool = tool;
    this.currentToolChanged.emit(tool);
  }

  public onSelectedToolChange(toggleChange: MatButtonToggleChange): void {
    this.changeTool(toggleChange.value as EditorTool);
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

  public onExportShip(): void {
    this.exportShip.emit();
  }

  public onClear(): void {
    //warn user before clearing
    if (confirm('Are you sure you want to clear the current design?')) {
      this.clearEditor.emit();
    }
  }

  /** Keyboard Shortcuts: */

  @HostListener('document:keydown.control.g', ['$event'])
  chooseSelectorTool(e: KeyboardEvent) {
    e.preventDefault();
    this.changeTool(EditorTool.NONE);
  }

  @HostListener('document:keydown.control.b', ['$event'])
  chooseBrushTool(e: KeyboardEvent) {
    e.preventDefault();
    this.changeTool(EditorTool.BRUSH);
  }

  @HostListener('document:keydown.control.e', ['$event'])
  chooseEraserTool(e: KeyboardEvent) {
    e.preventDefault();
    this.changeTool(EditorTool.ERASER);
  }

  @HostListener('document:keydown.control.d', ['$event'])
  chooseDoorTool(e: KeyboardEvent) {
    e.preventDefault();
    this.changeTool(EditorTool.DOOR);
  }

  @HostListener('document:keydown.control.z', ['$event'])
  performUndo(e: KeyboardEvent) {
    e.preventDefault();
    this.undoEdit.emit();
  }

  @HostListener('document:keydown.control.y', ['$event'])
  performRedo(e: KeyboardEvent) {
    e.preventDefault();
    this.redoEdit.emit();
  }
}
