import { AfterViewInit, Component, input, ViewChild } from '@angular/core';
import {
  CoreShapeComponent,
  StageComponent,
} from 'ng2-konva';
import { StageConfig } from 'konva/lib/Stage';
import { Layer } from 'konva/lib/Layer';
import { Rect, RectConfig } from 'konva/lib/shapes/Rect';
import { KonvaEventObject } from 'konva/lib/Node';
import { Shape } from 'konva/lib/Shape';

@Component({
  selector: 'app-ship-editor',
  standalone: true,
  imports: [StageComponent, CoreShapeComponent],
  templateUrl: './ship-editor.component.html',
  styleUrl: './ship-editor.component.scss'
})
export class ShipEditorComponent implements AfterViewInit {
  @ViewChild('stage') stage: StageComponent | undefined;
  @ViewChild('gridLayer') gridLayer: CoreShapeComponent | undefined;
  @ViewChild('designLayer') designLayer: CoreShapeComponent | undefined;
  
  /**
   * Width of the designer
   */
  editorWidth = input.required<number>();

  /**
   * Height of the designer
   */
  editorHeight = input.required<number>();

  /**
   * The size of each grid block side in pixels
   */
  gridBlockSize = input.required<number>();

  public configStage: Partial<StageConfig> = {};

  ngAfterViewInit(): void {
    
    // Initialize stage
    this.configStage = {
      width: this.editorWidth(),
      height: this.editorHeight(),
    }

    // Initialize grid layer
    this.initGrid();
  }

  private initGrid(): void {
    let gridLayer: Layer = (this.gridLayer?.getStage() as Layer);

    for (let x = 0; x < this.editorWidth(); x += this.gridBlockSize()) {
      for (let y = 0; y < this.editorHeight(); y += this.gridBlockSize()) {
        gridLayer.add(new Rect({x: x, y: y, width: this.gridBlockSize(), height: this.gridBlockSize(), stroke: '#D3D3D3', strokeWidth: 1}));
      }
    }
  }

  addRect(): void {
    let layer: Layer = (this.designLayer?.getStage() as Layer);

    let randomColor = '#' + Math.floor(Math.random()*16777215).toString(16);
    let newRect = new Rect({
      x: this.editorWidth() / 2, 
      y: this.editorHeight() / 2, 
      width: this.gridBlockSize(), 
      height: this.gridBlockSize(), 
      fill: randomColor, 
      draggable: true,
      stroke: '#fffff',
      strokeWidth: 1,
    } as RectConfig);
    
    let newShadowRect = new Rect({
      x: newRect.x(), 
      y: newRect.y(), 
      width: newRect.width(), 
      height: newRect.height(), 
      fill: "#fffff", 
      draggable: false,
      opacity: 0.6,
    } as RectConfig);

    newRect.on('dragstart', (event: KonvaEventObject<DragEvent>) => { this.bringToFront(event.target as Shape) });
    newRect.on('dragend', (event: KonvaEventObject<DragEvent>) => { this.snapToGrid(event.target as Shape) });
    newRect.on('dragmove', (_: KonvaEventObject<DragEvent>) => { 
      newShadowRect.position({
        x: Math.round(newRect.x() / this.gridBlockSize()) * this.gridBlockSize(),
        y: Math.round(newRect.y() / this.gridBlockSize()) * this.gridBlockSize()
      });
      layer.draw();
     });
    layer.add(newShadowRect);
    layer.add(newRect);
    layer.draw();
  }

  bringToFront(shape: Shape): void {
    let layer: Layer = shape.getLayer() as Layer;
    
    shape.show();
    shape.moveToTop();
    layer.draw
  }

  snapToGrid(shape: Shape): void {
    let layer: Layer = shape.getLayer() as Layer;
    shape.position({
      x: Math.round(shape.x() / this.gridBlockSize()) * this.gridBlockSize(),
      y: Math.round(shape.y() / this.gridBlockSize()) * this.gridBlockSize()
    });
    layer.draw();
  }
}
