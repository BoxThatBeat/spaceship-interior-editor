import { ShipElementType } from './ship-element-type.enum';
import { ShapeConfig } from 'konva/lib/Shape';

export class ShipElement {
  constructor(
    public type: ShipElementType,
    public tacticalValue: number,
    public imageSrc?: string,
    public shapeConfigs?: ShapeConfig[],
  ) {}
}
