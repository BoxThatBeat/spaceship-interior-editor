import { Shape, ShapeConfig } from 'konva/lib/Shape';
import { ShipElement } from './ship-element';
import { Vector2d } from 'konva/lib/types';
import { v4 as uuidv4 } from 'uuid';

export class ShipElementShape extends Shape<ShapeConfig> {

  public shipElementId: string;

  constructor(
    public shipElement: ShipElement,
    public gridPos: Vector2d, //TODO: probably don't need this
    public config: ShapeConfig
  ) {
    super(config);
    this.shipElementId = uuidv4(); //TODO: might not need this
  }
}
