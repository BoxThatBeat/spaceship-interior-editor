import { Shape, ShapeConfig } from 'konva/lib/Shape';
import { ShipElement } from './ship-element';
import { Vector2d } from 'konva/lib/types';


export class ShipElementShape {
  constructor(
    public shipElementId: string,
    public shipElement: ShipElement,
    public gridPos: Vector2d, //TODO: probably don't need this
    public config: ShapeConfig
  ) {}
}
