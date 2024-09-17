import { Component, computed, input } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { ShipElement } from '../../models/ship-element';

@Component({
  selector: 'app-side-bar',
  standalone: true,
  imports: [MatTabsModule, MatExpansionModule],
  templateUrl: './side-bar.component.html',
  styleUrl: './side-bar.component.scss',
})
export class SideBarComponent {
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
