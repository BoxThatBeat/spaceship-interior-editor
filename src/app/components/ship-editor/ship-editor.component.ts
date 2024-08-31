import { AfterViewInit, Component, effect, input, Signal, viewChild, ViewChild } from '@angular/core';
import { CoreShapeComponent, NgKonvaEventObject, StageComponent } from 'ng2-konva';
import { StageConfig } from 'konva/lib/Stage';
import { Layer } from 'konva/lib/Layer';
import { Rect, RectConfig } from 'konva/lib/shapes/Rect';
import { KonvaEventObject } from 'konva/lib/Node';
import { Shape } from 'konva/lib/Shape';
import { EditorTool } from '../../models/editor-tool.enum';
import { Vector2d } from 'konva/lib/types';
import { ShipElement } from '../../models/ship-element';
import { ShipElementType } from '../../models/ship-element-type.enum';

@Component({
  selector: 'app-ship-editor',
  standalone: true,
  imports: [StageComponent, CoreShapeComponent],
  templateUrl: './ship-editor.component.html',
  styleUrl: './ship-editor.component.scss',
})
export class ShipEditorComponent implements AfterViewInit {
  stage = viewChild.required(StageComponent);
  gridLayer: Signal<CoreShapeComponent> = viewChild.required('gridLayer');
  designLayer: Signal<CoreShapeComponent> = viewChild.required('designLayer');

  /**
   * Width of the designer.
   */
  editorWidth = input.required<number>();

  /**
   * Height of the designer.
   */
  editorHeight = input.required<number>();

  /**
   * The size of each grid block side in pixels.
   */
  gridBlockSize = input.required<number>();

  /**
   * Whether the grid is enabled.
   */
  gridEnabled = input<boolean>(true);

  /**
   * The currently selected tool.
   */
  selectedTool = input<EditorTool>(EditorTool.NONE);

  public configStage: Partial<StageConfig> = {};

  private shipElements: Array<Array<ShipElement | undefined>> = new Array<Array<ShipElement | undefined>>();
  private dragging: boolean = false;

  constructor() {
    // effect(() => {
    //   if (this.selectedTool() !== EditorTool.NONE) {
    //     this.stage().getStage().on('dragstart', () => this.onStageDragStart());
    //     this.stage().getStage().on('dragend', () => this.onStageDragEnd());
    //     this.stage().getStage().on('dragmove', () => this.onStageDragMove());
    //   } else {
    //     this.stage().getStage().off('dragstart');
    //     this.stage().getStage().off('dragend');
    //     this.stage().getStage().off('dragmove');
    //   }
    // });

    effect(() => {
      if (this.gridEnabled()) {
        this.gridLayer().getStage().show();
      } else {
        this.gridLayer().getStage().hide();
      }
    })
  }

  ngAfterViewInit(): void {
    // Initialize stage
    this.configStage = {
      width: this.editorWidth(),
      height: this.editorHeight(),
      draggable: false,
    };

    // Initialize grid layer
    this.initGrid();

    // Initialize shipElements 2D array
    for (let x = 0; x < this.editorWidth(); x += this.gridBlockSize()) {
      this.shipElements.push(new Array<ShipElement | undefined>(this.editorHeight() / this.gridBlockSize()));
    }
  }

  private initGrid(): void {
    let gridLayer: Layer = this.gridLayer().getStage() as Layer;

    for (let x = 0; x < this.editorWidth(); x += this.gridBlockSize()) {
      for (let y = 0; y < this.editorHeight(); y += this.gridBlockSize()) {
        gridLayer.add(
          new Rect({
            x: x,
            y: y,
            width: this.gridBlockSize(),
            height: this.gridBlockSize(),
            stroke: '#D3D3D3',
            strokeWidth: 1,
          }),
        );
      }
    }
  }

  onStageDragStart(): void {
    this.dragging = true;
    this.useTool();
  }

  onStageDragEnd(): void {
    this.dragging = false;
  }

  onStageDragMove(): void {
    if (this.dragging) {
      this.useTool();
    }
  }

  useTool(): void {
    switch (this.selectedTool()) {
      case EditorTool.BRUSH:
        this.addRoomAtPos(this.stage().getStage().getPointerPosition());
        break;
      case EditorTool.ERASER:
        this.removeRoomAtPos(this.stage().getStage().getPointerPosition());
        break;
    }
  }

  addRoomAtPos(pos: Vector2d | null): void {
    if (!pos) {
      return;
    }

    const xGrid = Math.floor(pos.x / this.gridBlockSize());
    const yGrid = Math.floor(pos.y / this.gridBlockSize());

    if (this.shipElements[xGrid][yGrid] === undefined) {
      this.addRect(pos);
    }
  }

  removeRoomAtPos(pos: Vector2d | null): void {
    if (!pos) {
      return;
    }
  }

  addRect(pos: Vector2d | null): void {
    if (!pos) {
      return;
    }
    const gridXPos = Math.floor(pos.x / this.gridBlockSize()) * this.gridBlockSize();
    const gridYPos = Math.floor(pos.y / this.gridBlockSize()) * this.gridBlockSize();

    const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
    const newRect = new Rect({
      x: gridXPos,
      y: gridYPos,
      width: this.gridBlockSize(),
      height: this.gridBlockSize(),
      fill: randomColor,
      draggable: true,
      stroke: '#fffff',
      strokeWidth: 1,
    } as RectConfig);

    const newShadowRect = new Rect({
      x: newRect.x(),
      y: newRect.y(),
      width: newRect.width(),
      height: newRect.height(),
      fill: '#fffff',
      draggable: false,
      opacity: 0.6,
    } as RectConfig);

    newRect.on('dragstart', (event: KonvaEventObject<DragEvent>) => {
      this.bringToFront(event.target as Shape);
    });
    newRect.on('dragend', (event: KonvaEventObject<DragEvent>) => {
      this.snapToGrid(event.target as Shape);
    });
    newRect.on('dragmove', (_: KonvaEventObject<DragEvent>) => {
      newShadowRect.position({
        x: Math.round(newRect.x() / this.gridBlockSize()) * this.gridBlockSize(),
        y: Math.round(newRect.y() / this.gridBlockSize()) * this.gridBlockSize(),
      });
    });

    // Convert x,y coordinates to grid coordinates
    const xGrid = Math.round(newRect.x() / this.gridBlockSize());
    const yGrid = Math.round(newRect.y() / this.gridBlockSize());

    const shipElement = new ShipElement(ShipElementType.HALLWAY, 100);

    this.addShipElement(shipElement, [newRect, newShadowRect], xGrid, yGrid);
  }

  bringToFront(shape: Shape): void {
    shape.show();
    shape.moveToTop();
  }

  snapToGrid(shape: Shape): void {
    shape.position({
      x: Math.round(shape.x() / this.gridBlockSize()) * this.gridBlockSize(),
      y: Math.round(shape.y() / this.gridBlockSize()) * this.gridBlockSize(),
    });
  }

  addShipElement(shipElement: ShipElement, shapes: Shape[], gridX: number, gridY: number): void {
    this.shipElements[gridX][gridY] = shipElement;
    let layer: Layer = this.designLayer().getStage() as Layer;
    shapes.forEach((shape) => layer.add(shape));
  }
}
