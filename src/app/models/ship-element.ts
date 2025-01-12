import { Range } from "./range.enum";

interface ShipElementBase {
  name: string;
  type: string;
  tacticalValue: number;
  notes?: string[];
  imageFileName?: string;
  imageUrl?: string;
  imageWidth: string;
  imageHeight: string
}

export interface ShipWeapon extends ShipElementBase {
  damage: number;
  accuracy: number;
  minRange: Range;
  maxRange: Range;
}

export interface ShipEngine extends ShipElementBase {
  range: Range;
}

export interface ShipShieldGenerator extends ShipElementBase {
  capacitors: number;
}

export type ShipElement = ShipElementBase | ShipWeapon | ShipEngine | ShipShieldGenerator;

export function isShipWeapon(element: ShipElement): element is ShipWeapon {
  return (element as ShipWeapon).damage !== undefined;
}

export function isShipEngine(element: ShipElement): element is ShipEngine {
  return (element as ShipEngine).range !== undefined;
}

export function isShipShieldGenerator(element: ShipElement): element is ShipShieldGenerator {
  return (element as ShipShieldGenerator).capacitors !== undefined;
}