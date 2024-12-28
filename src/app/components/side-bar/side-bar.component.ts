import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { ShipElement } from '../../models/ship-element';
import { ShipElementComponent } from '../ship-element/ship-element.component';

@Component({
  selector: 'app-side-bar',
  standalone: true,
  imports: [MatTabsModule, MatExpansionModule, ShipElementComponent],
  templateUrl: './side-bar.component.html',
  styleUrl: './side-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SideBarComponent {
  heldShipElement = output<ShipElement>();

  public onHeldImageSrcChange(heldImageSrc: string): void {
    const shipElementPickedUp = this.shipElements().find((shipElement) => shipElement.imageFileName?.split('/').pop() === heldImageSrc.split('/').pop());
    if (shipElementPickedUp) {
      shipElementPickedUp.imageUrl = heldImageSrc;
      this.heldShipElement.emit(shipElementPickedUp);
    } else {
      console.error('Could not find ship element with image src: ' + heldImageSrc);
    }
  }

  /**
   * Ship elements to display loaded from json config
   */
  shipElements = input.required<ShipElement[]>();

  /**
   * A mapping from ship element type to the ship elements of that type.
   */
  shipElementTypes = computed(() => {
    const shipElementTypes = new Map<string, ShipElement[]>();
    this.shipElements().forEach((shipElement) => {
      if (!shipElementTypes.has(shipElement.type)) {
        shipElementTypes.set(shipElement.type, []);
      }
      shipElementTypes.get(shipElement.type)!.push(shipElement);
    });
    return shipElementTypes;
  });
}
