import { NgStyle } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-context-menu',
  standalone: true,
  imports: [NgStyle],
  templateUrl: './context-menu.component.html',
  styleUrl: './context-menu.component.scss',
})
/** A context menu for when the user right clicks */
export class ContextMenuComponent {

  visible = input.required<boolean>();
  topPosPx = input.required<number>();
  leftPosPx = input.required<number>();

  duplicateButtonPressed = output<void>();
  deleteButtonPressed = output<void>();

  onDuplicateButtonPressed() {
    this.duplicateButtonPressed.emit();
  }
  onDeleteButtonPressed() {
    this.deleteButtonPressed.emit();
  }
}
