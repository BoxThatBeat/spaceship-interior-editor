import { ShipElement } from './ship-element';
import { ShipElementType } from './ship-element-type.enum';

export class ShipWeapon extends ShipElement {
  constructor(
    public override type: ShipElementType,
    public override tacticalValue: number,

    public damage: number,
    public range: number,
    public bth: number,

    public override imageSrc?: string,
    public ammo?: number,
  ) {
    super(type, tacticalValue, imageSrc);
  }
}
