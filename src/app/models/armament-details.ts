import { GroupConfig } from 'konva/lib/Group';
import { RectConfig } from 'konva/lib/shapes/Rect';
import { TextConfig } from 'konva/lib/shapes/Text';

const textPadding: number = 15;
const fontFamily: string = 'Calibri';
const fontColor: string = 'black';

export default class ArmamentDetails {
  public readonly armamentGroupConfig: GroupConfig = {
    x: 0,
    y: 0,
    draggable: true,
  } as GroupConfig
  public readonly armamentGroupRectConfigs: Array<RectConfig> = [
    {
      x: 0,
      y: 0,
      width: 500,
      height: 900,
      fill: 'white',
      stroke: 'black',
      strokeWidth: 2,
    } as RectConfig,
    {
      x: 500,
      y: 0,
      width: 200,
      height: 900,
      fill: 'white',
      stroke: 'black',
      strokeWidth: 2,
    } as RectConfig,
    {
      x: 700,
      y: 0,
      width: 200,
      height: 900,
      fill: 'white',
      stroke: 'black',
      strokeWidth: 2,
    } as RectConfig,
    {
      x: 0,
      y: 900,
      width: 1000,
      height: 400,
      fill: 'white',
      stroke: 'black',
      strokeWidth: 2,
    } as RectConfig,
  ]
  
  public readonly armamentGroupStaticTextConfigs: Array<TextConfig> = [
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
      x: 700 + textPadding,
      y: textPadding,
      text: 'ACC',
      fontSize: 50,
      fontFamily: fontFamily,
      fontStyle: 'bold',
      fill: fontColor,
    } as TextConfig,
  ]

  public currentNumWeapons: number = 0;
  public weaponDetailsList: Array<Array<TextConfig>> = [];
  public weaponCounts: Map<string, number> = new Map<string, number>();


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
        y: 100 + this.currentNumWeapons * 100,
        text: name,
        fontSize: 40,
        fontFamily: fontFamily,
        fill: fontColor,
      } as TextConfig);

      weaponDetails.push({
        x: 500 + textPadding,
        y: 100 + this.currentNumWeapons * 100,
        text: damage.toString(),
        fontSize: 40,
        fontFamily: fontFamily,
        fill: fontColor,
      } as TextConfig);

      weaponDetails.push({
        x: 700 + textPadding,
        y: 100 + this.currentNumWeapons * 100,
        text: accuracy.toString(),
        fontSize: 40,
        fontFamily: fontFamily,
        fill: fontColor,
      } as TextConfig);

      this.weaponDetailsList.push(weaponDetails);

      this.currentNumWeapons++;
      // dynamically update the height of the armamentGroupRectConfigs[0]
    }
  }

  removeWeapon(name: string): void {
    // Only remove the weapon text if there are 0 instances of the weapon left
    const weaponCount = this.weaponCounts.get(name);
    if (weaponCount && weaponCount === 1) {
      this.weaponCounts.set(name, weaponCount - 1);
      let index = this.weaponDetailsList.findIndex((weaponDetails) => weaponDetails[0].text === name);
      this.weaponDetailsList.splice(index, 1);
      this.currentNumWeapons--;
      // dynamically update the height of the armamentGroupRectConfigs[0]
    }
  }

  // Store the weapon information here
  // Store the shield info here

}