import { ShipElementType } from './ship-element-type.enum';

export class ShipElement {
  constructor(
    public type: ShipElementType,
    public tacticalValue: number,
    public imageSrc?: string,
  ) {}
}
