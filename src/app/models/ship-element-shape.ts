import { Shape, ShapeConfig } from 'konva/lib/Shape';
import { ShipElement } from './ship-element';

export class ShipElementShape extends Shape<ShapeConfig> {
  constructor(
    public shipElement: ShipElement,
    public config: ShapeConfig
  ) {
    super(config);
  }
}
