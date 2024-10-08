import { ShipElementType } from './ship-element-type.enum';
import { ShapeConfig } from 'konva/lib/Shape';

export class ShipElement {
  constructor(
    public name: string,
    public type: string,
    public tacticalValue: number,
    public notes?: string[],
    public image?: string,
    public shapeConfigs?: ShapeConfig[], //TODO: move ShipElement into an implementation of Shape and then remove this
  ) {}
}
