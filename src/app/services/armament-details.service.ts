import { Injectable, signal, WritableSignal } from '@angular/core';
import { RectConfig } from 'konva/lib/shapes/Rect';
import { TextConfig } from 'konva/lib/shapes/Text';
import { Range } from '../models/range.enum';

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
      y: 0,
      width: 500,
      height: 400,
      fill: 'white',
      stroke: 'black',
      strokeWidth: 2,
    } as RectConfig,
    {
      x: 500,
      y: 0,
      width: 150,
      height: 400,
      fill: 'white',
      stroke: 'black',
      strokeWidth: 2,
    } as RectConfig,
    {
      x: 650,
      y: 0,
      width: 150,
      height: 400,
      fill: 'white',
      stroke: 'black',
      strokeWidth: 2,
    } as RectConfig,
    {
      x: 0,
      y: 400,
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
      y: textPadding,
      text: 'WEAPON',
      fontSize: 50,
      fontFamily: fontFamily,
      fontStyle: 'bold',
      fill: fontColor,
    } as TextConfig,
    {
      x: 500 + textPadding,
      y: textPadding,
      text: 'DMG',
      fontSize: 50,
      fontFamily: fontFamily,
      fontStyle: 'bold',
      fill: fontColor,
    } as TextConfig,
    {
      x: 650 + textPadding,
      y: textPadding,
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

  public addWeapon(name: string, damage: number, accuracy: number): void {
    // Only adds text if this is the first time the specific weapon name is added

    //TODO: instead, any time a weapon is added or removed, loop over them all and rebuild the list of configs. to prevent holes in the visual list
    const weaponCount = this.weaponCounts.get(name);
    if (weaponCount || weaponCount === 0) {
      this.weaponCounts.set(name, weaponCount + 1);
    } else {
      this.weaponCounts.set(name, 1);

      let weaponDetails: Array<TextConfig> = [];
      weaponDetails.push({
        x: 0 + textPadding,
        y: 75 + this.currentNumWeapons * distanceBetweenWeaponText,
        text: name,
        fontSize: 40,
        fontFamily: fontFamily,
        fill: fontColor,
      } as TextConfig);

      weaponDetails.push({
        x: 500 + textPadding + 10,
        y: 75 + this.currentNumWeapons * distanceBetweenWeaponText,
        text: damage.toString(),
        fontSize: 40,
        fontFamily: fontFamily,
        fill: fontColor,
      } as TextConfig);

      weaponDetails.push({
        x: 650 + textPadding + 10,
        y: 75 + this.currentNumWeapons * distanceBetweenWeaponText,
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
    }
  }

  removeWeapon(name: string): void {
    // Only remove the weapon text if there are 0 instances of the weapon left
    const weaponCount = this.weaponCounts.get(name);
    if (weaponCount && weaponCount === 1) {
      this.weaponCounts.set(name, weaponCount - 1);
      let index = this.weaponDetailsList().findIndex((weaponDetails) => weaponDetails[0].text === name);
      
      this.weaponDetailsList.update((weaponDetailsList) => {
        weaponDetailsList.splice(index, 1);
        return weaponDetailsList;
      });
      this.currentNumWeapons--;
      // dynamically update the height of the armamentGroupRectConfigs[0]
    }
  }

  addEngine(name: string, range: Range): void {

  }

  addShieldGenerator(name: string, capacitors: number): void {

  }

  updateTotalCost(amount: number): void {

  }

  updateShipTitle(title: string): void {

  }

  

}