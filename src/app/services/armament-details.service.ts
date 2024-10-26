import { Injectable, signal, WritableSignal } from '@angular/core';
import { RectConfig } from 'konva/lib/shapes/Rect';
import { TextConfig } from 'konva/lib/shapes/Text';
import { Range } from '../models/range.enum';
import { isShipEngine, isShipShieldGenerator, isShipWeapon, ShipElement } from '../models/ship-element';

const textPadding: number = 15;
const distanceBetweenWeaponText: number = 50;
const fontFamily: string = 'Calibri';
const fontColor: string = 'black';

@Injectable({
  providedIn: 'root'
})
export default class ArmamentDetailsService {
  public readonly staticGroupRectConfigs: Array<RectConfig> = [
    {
      x: 0,
      y: 100,
      width: 500,
      height: 400,
      fill: 'white',
      stroke: 'black',
      strokeWidth: 2,
    } as RectConfig,
    {
      x: 500,
      y: 100,
      width: 150,
      height: 400,
      fill: 'white',
      stroke: 'black',
      strokeWidth: 2,
    } as RectConfig,
    {
      x: 650,
      y: 100,
      width: 150,
      height: 400,
      fill: 'white',
      stroke: 'black',
      strokeWidth: 2,
    } as RectConfig,
    {
      x: 0,
      y: 500,
      width: 800,
      height: 200,
      fill: 'white',
      stroke: 'black',
      strokeWidth: 2,
    } as RectConfig,
  ]
  
  public readonly staticTextConfigs: Array<TextConfig> = [
    {
      x: 0 + textPadding,
      y: 100 + textPadding,
      text: 'WEAPON',
      fontSize: 50,
      fontFamily: fontFamily,
      fontStyle: 'bold',
      fill: fontColor,
    } as TextConfig,
    {
      x: 500 + textPadding,
      y: 100 + textPadding,
      text: 'DMG',
      fontSize: 50,
      fontFamily: fontFamily,
      fontStyle: 'bold',
      fill: fontColor,
    } as TextConfig,
    {
      x: 650 + textPadding,
      y: 100 + textPadding,
      text: 'ACC',
      fontSize: 50,
      fontFamily: fontFamily,
      fontStyle: 'bold',
      fill: fontColor,
    } as TextConfig,
  ]

  private currentNumWeapons: number = 0;
  private weaponCounts: Map<string, number> = new Map<string, number>();

  public weaponDetailsList: WritableSignal<Array<Array<TextConfig>>> = signal([]);
  public shipTitleTextConfig: WritableSignal<TextConfig> = signal({
    x: 0,
    y: 0,
    text: 'Ship Title',
    fontSize: 100,
    fontFamily: fontFamily,
    fontStyle: 'bold',
    fill: fontColor,
  } as TextConfig );

  public updateTotalCost(amount: number): void {
    
  }

  public updateShipTitle(title: string): void {
    this.shipTitleTextConfig.update((shipTitleTextConfig) => {
      let titleCopy = { ...shipTitleTextConfig } as TextConfig;
      titleCopy.text = title;
      return titleCopy;
    });
  }
  
  public addShipElement(shipElement: ShipElement): void {
    if (isShipWeapon(shipElement)) {
      this.addWeapon(shipElement.name, shipElement.damage, shipElement.accuracy);
    } else if (isShipEngine(shipElement)) {
    this.addEngine(shipElement.name, shipElement.speed);
    } else if (isShipShieldGenerator(shipElement)) {
      this.addShieldGenerator(shipElement.name, shipElement.capacitors);
    }
  }

  public removeShipElement(shipElement: ShipElement): void {
    if (isShipWeapon(shipElement)) {
      this.removeWeapon(shipElement.name);
    } else if (isShipEngine(shipElement)) {
      console.log('deleting engine');
    } else if (isShipShieldGenerator(shipElement)) {
      console.log('deleting shield generator');
    }
  }

  public clearShipElements(): void {
    this.weaponCounts.clear();
    this.weaponDetailsList.update(() => []);
    this.currentNumWeapons = 0;
  }

  private addWeapon(name: string, damage: number, accuracy: number): void {
    // Only adds text if this is the first time the specific weapon name is added
    const weaponCount = this.weaponCounts.get(name);
    if (!weaponCount || (weaponCount && weaponCount === 0)) {
      this.weaponCounts.set(name, 1);

      let weaponDetails: Array<TextConfig> = [];
      weaponDetails.push({
        x: 0 + textPadding,
        y: 175 + this.currentNumWeapons * distanceBetweenWeaponText,
        text: name,
        fontSize: 40,
        fontFamily: fontFamily,
        fill: fontColor,
      } as TextConfig);

      weaponDetails.push({
        x: 500 + textPadding + 10,
        y: 175 + this.currentNumWeapons * distanceBetweenWeaponText,
        text: damage.toString(),
        fontSize: 40,
        fontFamily: fontFamily,
        fill: fontColor,
      } as TextConfig);

      weaponDetails.push({
        x: 650 + textPadding + 10,
        y: 175 + this.currentNumWeapons * distanceBetweenWeaponText,
        text: accuracy.toString(),
        fontSize: 40,
        fontFamily: fontFamily,
        fill: fontColor,
      } as TextConfig);

      this.weaponDetailsList.update((weaponDetailsList) => {
        weaponDetailsList.push(weaponDetails);
        return weaponDetailsList;
      });

      this.currentNumWeapons++;
      // dynamically update the height of the armamentGroupRectConfigs[0]
    } else {
      this.weaponCounts.set(name, weaponCount + 1);
    }
  }

  private removeWeapon(name: string): void {
    // Only remove the weapon text if there are 0 instances of the weapon left
    const weaponCount = this.weaponCounts.get(name);
    if (!weaponCount) {
      return;
    }
    
    if (weaponCount === 1) {
      let index = this.weaponDetailsList().findIndex((weaponDetails) => weaponDetails[0].text === name);
      
      this.weaponDetailsList.update((weaponDetailsList) => {
        let weaponDetailsCopy = [...weaponDetailsList];
        weaponDetailsCopy.splice(index, 1);

        // loop over all the weaponDetails and set the y values again
        for (let i = 0; i < weaponDetailsCopy.length; i++) {
          weaponDetailsCopy[i][0].y = 175 + i * distanceBetweenWeaponText;
          weaponDetailsCopy[i][1].y = 175 + i * distanceBetweenWeaponText;
          weaponDetailsCopy[i][2].y = 175 + i * distanceBetweenWeaponText;
        }
        return weaponDetailsCopy;
      });

      this.currentNumWeapons--;

      // dynamically update the height of the armamentGroupRectConfigs[0]
    }

    this.weaponCounts.set(name, weaponCount - 1);
  }

  private addEngine(name: string, range: Range): void {

  }

  private removeEngine(name: string): void {

  }

  private addShieldGenerator(name: string, capacitors: number): void {

  }

  private removeShieldGenerator(name: string): void {

  }
}