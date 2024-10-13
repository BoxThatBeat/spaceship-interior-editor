export class ShipElement {
  constructor(
    public name: string,
    public type: string,
    public tacticalValue: number,
    public notes?: string[],
    public imageFileName?: string, //TODO make not optional
    public imageUrl?: string
  ) {}
}
