import { NgStyle } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { EditorTool } from '../../models/editor-tool.enum';

@Component({
  selector: 'app-context-menu',
  standalone: true,
  imports: [NgStyle],
  templateUrl: './context-menu.component.html',
  styleUrl: './context-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/** A context menu for when the user right clicks */
export class ContextMenuComponent {

  /**
   * The currently selected tool.
   */
  selectedTool = input<EditorTool>(EditorTool.NONE);
  public EditorTool = EditorTool;

  visible = input.required<boolean>();
  topPosPx = input.required<number>();
  leftPosPx = input.required<number>();

  duplicateButtonPressed = output<void>();
  deleteButtonPressed = output<void>();
  clearDoorsButtonPressed = output<void>();
  clearPenButtonPressed = output<void>();


  onDuplicateButtonPressed() {
    this.duplicateButtonPressed.emit();
  }
  onDeleteButtonPressed() {
    this.deleteButtonPressed.emit();
  }
  onClearDoorsButtonPressed() {
    this.clearDoorsButtonPressed.emit();
  }
  onClearPenButtonPressed() {
    this.clearPenButtonPressed.emit();
  }
}
