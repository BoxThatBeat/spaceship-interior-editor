import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  OnInit,
  signal,
  Signal,
  viewChild,
  WritableSignal,
} from '@angular/core';
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
import { ImageConfig } from 'konva/lib/shapes/Image';

@Component({
  selector: 'app-ship-editor',
  standalone: true,
  imports: [StageComponent, CoreShapeComponent],
  templateUrl: './ship-editor.component.html',
  styleUrl: './ship-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipEditorComponent implements OnInit {
  stage = viewChild.required(StageComponent);
  gridLayer: Signal<CoreShapeComponent> = viewChild.required('gridLayer');
  designLayer: Signal<CoreShapeComponent> = viewChild.required('designLayer');

  gridRectConfigs: WritableSignal<Array<RectConfig>> = signal([]);
  shipElements: WritableSignal<Array<Array<ShipElement | undefined>>> = signal([]);

  /**
   * The image source string of the image currently being held by the user (with a mouse drag).
   */
  currentlyHeldImageSrc = input.required<string>();

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
  gridEnabled = input<boolean>();

  /**
   * The currently selected tool.
   */
  selectedTool = input<EditorTool>(EditorTool.NONE);

  public configStage: Partial<StageConfig> = {};

  private dragging: boolean = false;
  private selectedShape: Shape | undefined = undefined;
  private selectedElementStartPos: Vector2d | undefined = undefined;

  constructor() {
    effect(() => {
      if (this.gridEnabled()) {
        this.gridLayer().getStage().show();
      } else {
        this.gridLayer().getStage().hide();
      }
    });
  }

  removeStageListeners() {
    this.stage().getStage().off('mousedown');
    this.stage().getStage().off('mouseup');
    this.stage().getStage().off('mousemove');
  }

  ngOnInit(): void {
    // Initialize stage
    this.configStage = {
      width: this.editorWidth(),
      height: this.editorHeight(),
      draggable: false,
    };

    this.initGrid();
    this.initShipElements();
  }

  /**
   * Initializes the grid layer with a grid of rectangles.
   */
  private initGrid(): void {
    for (let x = 0; x < this.editorWidth(); x += this.gridBlockSize()) {
      for (let y = 0; y < this.editorHeight(); y += this.gridBlockSize()) {
        this.gridRectConfigs.update((rects) => [
          ...rects,
          {
            x: x,
            y: y,
            width: this.gridBlockSize(),
            height: this.gridBlockSize(),
            stroke: '#D3D3D3',
            strokeWidth: 1,
            listening: false,
          },
        ]);
      }
    }
  }

  /**
   * Initializes a 2D array of ship elements. Each element uses either a Kova Shape to repesent the element or an image
   */
  private initShipElements(): void {
    for (let x = 0; x <= this.editorWidth(); x += this.gridBlockSize()) {
      this.shipElements.update((shipElements) => [
        ...shipElements,
        new Array<ShipElement | undefined>(this.editorHeight() / this.gridBlockSize()),
      ]);
    }
  }

  onToolStageDragStart(ngEvent: NgKonvaEventObject<MouseEvent>): void {
    this.dragging = true;

    if (!ngEvent.event) {
      return;
    }

    switch (this.selectedTool()) {
      case EditorTool.BRUSH:
        this.addRoomAtPos(this.stage().getStage().getPointerPosition());
        break;
      case EditorTool.ERASER:
        this.removeRoomAtPos(this.stage().getStage().getPointerPosition());
        break;
      case EditorTool.NONE:
        if (ngEvent.event.target !== this.stage().getStage()) {
          const shape = ngEvent.event.target as Shape;
          this.bringToFront(shape);
          this.selectedShape = shape;

          const pointerPos = this.stage().getStage().getPointerPosition();
          if (!pointerPos) {
            break;
          }

          const xGrid = Math.floor(pointerPos.x / this.gridBlockSize());
          const yGrid = Math.floor(pointerPos.y / this.gridBlockSize());
          this.selectedElementStartPos = { x: xGrid, y: yGrid } as Vector2d;
        }
        break;
    }
  }

  onToolStageDragMove(ngEvent: NgKonvaEventObject<MouseEvent>): void {
    if (!ngEvent.event) {
      return;
    }

    if (this.dragging) {
      switch (this.selectedTool()) {
        case EditorTool.BRUSH:
          this.addRoomAtPos(this.stage().getStage().getPointerPosition());
          break;
        case EditorTool.ERASER:
          this.removeRoomAtPos(this.stage().getStage().getPointerPosition());
          break;
        case EditorTool.NONE:
          if (this.selectedShape) {
            this.selectedShape.position({
              x: this.selectedShape.x() + ngEvent.event.evt.movementX,
              y: this.selectedShape.y() + ngEvent.event.evt.movementY,
            });
          } else {
            // if (ngEvent.event.target !== this.stage().getStage()) {
            //   const shape = ngEvent.event.target as Shape;
            //   shape.position({
            //     x: shape.x() + ngEvent.event.evt.movementX,
            //     y: shape.y() + ngEvent.event.evt.movementY,
            //   });
            // }
          }
          break;
      }
    }
  }

  onToolStageDragEnd(ngEvent: NgKonvaEventObject<MouseEvent>): void {
    this.dragging = false;

    if (!ngEvent.event) {
      return;
    }

    if (this.selectedTool() === EditorTool.NONE) {
      if (this.selectedShape) {
        // Update position of ship element in 2D array
        if (this.selectedElementStartPos) {
          const xGrid = Math.floor(this.selectedShape.x() / this.gridBlockSize());
          const yGrid = Math.floor(this.selectedShape.y() / this.gridBlockSize());
          this.shipElements.update((shipElements) => {
            if (this.selectedElementStartPos) {
              const shipElement = shipElements[this.selectedElementStartPos.x][this.selectedElementStartPos.y];
              shipElements[this.selectedElementStartPos.x][this.selectedElementStartPos.y] = undefined;
              shipElements[xGrid][yGrid] = shipElement;
              console.log('moved element from ', this.selectedElementStartPos, ' to ', { x: xGrid, y: yGrid });
            }
            return shipElements;
          });
          console.log(this.shipElements());
        }

        this.snapToGrid(this.selectedShape);
      }

      this.selectedShape = undefined;
      this.selectedElementStartPos = undefined;

      // TODO: save original position of element and if placement is invalid, revert to original position and show error banner for a short period of time
    }
  }

  onContainerDragOver(event: any) {
    event.preventDefault();
  }

  onImageDropped(event: any) {
    event.preventDefault();

    // register event position
    this.stage().getStage().setPointersPositions(event);

    let pos = this.stage().getStage().getPointerPosition();

    if (pos === null) {
      return;
    }

    const gridXPos = Math.floor(pos.x / this.gridBlockSize()) * this.gridBlockSize();
    const gridYPos = Math.floor(pos.y / this.gridBlockSize()) * this.gridBlockSize();

    // Convert x,y coordinates to grid coordinates
    const xGrid = Math.round(gridXPos / this.gridBlockSize());
    const yGrid = Math.round(gridYPos / this.gridBlockSize());

    const img = document.createElement('img');
    img.src = this.currentlyHeldImageSrc();
    let image: ImageConfig = {
      name: 'image',
      image: img,
      x: pos.x,
      y: pos.y,
      //offsetX:
      //offsetY:
    };

    console.log(image);

    this.shipElements.update((shipElements) => {
      shipElements[xGrid][yGrid] = new ShipElement('Hull', 'Other', 100, [], undefined, [image]); //TODO: propogate the ShipElement held instead of just the image src
      return shipElements;
    });
  }

  getShipElementAtMousePos(mousePos: Vector2d | null): ShipElement | undefined {
    if (!mousePos) {
      return undefined;
    }
    const xGrid = Math.floor(mousePos.x / this.gridBlockSize());
    const yGrid = Math.floor(mousePos.y / this.gridBlockSize());
    return this.shipElements()[xGrid][yGrid];
  }

  addRoomAtPos(pos: Vector2d | null): void {
    if (!pos) {
      return;
    }

    const xGrid = Math.floor(pos.x / this.gridBlockSize());
    const yGrid = Math.floor(pos.y / this.gridBlockSize());

    if (this.shipElements()[xGrid][yGrid] === undefined) {
      this.addRect(pos);
    }
  }

  removeRoomAtPos(pos: Vector2d | null): void {
    if (!pos) {
      return;
    }

    const xGrid = Math.floor(pos.x / this.gridBlockSize());
    const yGrid = Math.floor(pos.y / this.gridBlockSize());

    if (this.shipElements()[xGrid][yGrid] !== undefined) {
      this.shipElements.update((shipElements) => {
        shipElements[xGrid][yGrid] = undefined;
        return shipElements;
      });
    }
  }

  clearEditor(): void {
    this.shipElements.set([]);
    this.initShipElements();
  }

  addRect(pos: Vector2d | null): void {
    if (!pos) {
      return;
    }
    const gridXPos = Math.floor(pos.x / this.gridBlockSize()) * this.gridBlockSize();
    const gridYPos = Math.floor(pos.y / this.gridBlockSize()) * this.gridBlockSize();

    // Convert x,y coordinates to grid coordinates
    const xGrid = Math.round(gridXPos / this.gridBlockSize());
    const yGrid = Math.round(gridYPos / this.gridBlockSize());

    const newRectConfig = {
      name: 'rect',
      x: gridXPos,
      y: gridYPos,
      width: this.gridBlockSize(),
      height: this.gridBlockSize(),
      fill: '#808080',
      stroke: '#fffff',
      strokeWidth: 1,
    } as RectConfig;

    this.shipElements.update((shipElements) => {
      shipElements[xGrid][yGrid] = new ShipElement('Hull', 'Other', 100, [], undefined, [newRectConfig]);
      return shipElements;
    });
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
}
