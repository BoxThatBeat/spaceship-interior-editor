export class ShipElement {
  constructor(
    public name: string,
    public type: string,
    public tacticalValue: number,
    public notes?: string[],
    public image?: string, //TODO make not optional
  ) {}
}
