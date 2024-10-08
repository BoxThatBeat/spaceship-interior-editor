import { Component, input, OnInit, output, Signal, viewChild } from '@angular/core';
import { ShipElement } from '../../models/ship-element';

@Component({
  selector: 'app-ship-element',
  standalone: true,
  imports: [],
  templateUrl: './ship-element.component.html',
  styleUrl: './ship-element.component.scss',
})
export class ShipElementComponent {
  shipElement = input.required<ShipElement>();

  heldImageSrc = output<string>();

  public onImageDrag(event: any): void {
    this.heldImageSrc.emit(event.target.src);
  }
}
