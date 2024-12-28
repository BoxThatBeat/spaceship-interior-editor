import { ChangeDetectionStrategy, Component, input, OnInit, output, signal } from '@angular/core';
import { ShipElement } from '../../models/ship-element';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ship-element',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ship-element.component.html',
  styleUrl: './ship-element.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipElementComponent implements OnInit {
  shipElement = input.required<ShipElement>();
  wideImage = signal(false);

  heldImageSrc = output<string>();

  ngOnInit(): void {
    if (this.shipElement().imageWidth > this.shipElement().imageHeight) {
      this.wideImage.set(true);
    }
  }

  public onImageDrag(event: any): void {
    this.heldImageSrc.emit(event.target.src);
  }
}
