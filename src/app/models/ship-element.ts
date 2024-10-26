import { Range } from "./range.enum";

interface ShipElementBase {
  name: string;
  type: string;
  tacticalValue: number;
  notes?: string[];
  imageFileName?: string;
  imageUrl?: string;
}

interface ShipWeapon extends ShipElementBase {
  damage: number;
  accuracy: number;
  range?: Range;
}

interface ShipEngine extends ShipElementBase {
  speed: Range;
}

interface ShipShieldGenerator extends ShipElementBase {
  capacitors: number;
}

export type ShipElement = ShipElementBase | ShipWeapon | ShipEngine | ShipShieldGenerator;

export function isShipWeapon(element: ShipElement): element is ShipWeapon {
  return (element as ShipWeapon).damage !== undefined;
}

export function isShipEngine(element: ShipElement): element is ShipEngine {
  return (element as ShipEngine).speed !== undefined;
}

export function isShipShieldGenerator(element: ShipElement): element is ShipShieldGenerator {
  return (element as ShipShieldGenerator).capacitors !== undefined;
}