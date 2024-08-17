import { AfterViewInit, Component, input, ViewChild } from '@angular/core';
import {
  CoreShapeComponent,
  StageComponent,
} from 'ng2-konva';
import { StageConfig } from 'konva/lib/Stage';
import { Layer } from 'konva/lib/Layer';
import { Rect, RectConfig } from 'konva/lib/shapes/Rect';
import { KonvaEventObject } from 'konva/lib/Node';

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
    let newRect = new Rect({x: 200, y: 200, width: this.gridBlockSize(), height: this.gridBlockSize(), fill: 'red', draggable: true} as RectConfig);

    newRect.on('dragend', this.snapToGrid.bind(this));
    layer.add(newRect);
    layer.draw();
  }

  snapToGrid(event: KonvaEventObject<DragEvent>): void {
    let rect = event.target as Rect;
    let layer: Layer = rect.getLayer() as Layer;
    rect.position({
      x: Math.round(rect.x() / this.gridBlockSize()) * this.gridBlockSize(),
      y: Math.round(rect.y() / this.gridBlockSize()) * this.gridBlockSize()
    });
    layer.draw();
  }
}
