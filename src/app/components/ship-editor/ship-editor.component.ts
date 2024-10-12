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
import { ShipElementShape } from '../../models/ship-element-shape';

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
  //shipElements: WritableSignal<Array<Array<ShipElement | undefined>>> = signal([]); //TODO: Update to 3D for z-index

  hullRectConfigs: WritableSignal<Array<Rect>> = signal([]);
  shipElementShapes: WritableSignal<Array<ShipElementShape>> = signal([]);

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
  private shapeSelected: boolean = false;
  private selectedShipElementShape: ShipElementShape | undefined = undefined;
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
    // for (let x = 0; x <= this.editorWidth(); x += this.gridBlockSize()) {
    //   this.shipElements.update((shipElements) => [
    //     ...shipElements,
    //     new Array<ShipElement | undefined>(this.editorHeight() / this.gridBlockSize()),
    //   ]);
    // }

    // // init all elements to undefined
    // for (let x = 0; x < this.editorWidth(); x += this.gridBlockSize()) {
    //   for (let y = 0; y < this.editorHeight(); y += this.gridBlockSize()) {
    //     this.shipElements.update((shipElements) => {
    //       shipElements[x / this.gridBlockSize()][y / this.gridBlockSize()] = undefined;
    //       return shipElements;
    //     });
    //   }
    // }
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
        // if (ngEvent.event.target !== this.stage().getStage()) {
        //   const shipElementShape = ngEvent.event.target as ShipElementShape;
        //   if (shipElementShape) {
        //     this.shipElementShapes.update((shipElementShapes) => { shipElementShapes.splice(shipElementShapes.indexOf(shipElementShape), 1); return shipElementShapes; });
        //   } else {
        //     console.log('error: no ship element shape found');
        //   }
        // }
        break;
      case EditorTool.NONE:
        if (ngEvent.event.target !== this.stage().getStage()) {
          const shipElementShape = ngEvent.event.target as ShipElementShape;

          if (shipElementShape) {
            this.bringToFront(shipElementShape);

            this.selectedElementStartPos = { x: shipElementShape.x(), y: shipElementShape.y() } as Vector2d;
            this.selectedShipElementShape = shipElementShape;
          }
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
          // const shipElementShape = ngEvent.event.target as ShipElementShape;
          // if (shipElementShape) {
          //   this.shipElementShapes.update((shipElementShapes) => { shipElementShapes.splice(shipElementShapes.indexOf(shipElementShape), 1); return shipElementShapes; });
          // } else {
          //   console.log('error: no ship element shape found');
          // }
          break;
        case EditorTool.NONE:
          if (this.selectedShipElementShape) {
            this.selectedShipElementShape.position({
              x: this.selectedShipElementShape.x() + ngEvent.event.evt.movementX,
              y: this.selectedShipElementShape.y() + ngEvent.event.evt.movementY,
            });
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
      if (this.selectedShipElementShape) {
        this.snapToGrid(this.selectedShipElementShape);
      }

      this.selectedShipElementShape = undefined;
      this.shapeSelected = false;

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

    const gridSnappedPos = this.posSnappedToGrid(pos);
    const gridCoords = this.posToGridCoords(gridSnappedPos);

    const img = document.createElement('img');
    img.src = this.currentlyHeldImageSrc();
    let image: ImageConfig = {
      name: 'image',
      image: img,
      x: gridSnappedPos.x,
      y: gridSnappedPos.y,
    };

    //TODO: get the shipElement object from the sidebar
    this.shipElementShapes.update((shipElementShapes) => {
      shipElementShapes.push(new ShipElementShape(new ShipElement('Hull', 'Other', 100, [], undefined, [image]), image));
      return shipElementShapes;
    });
  }

  // getShipElementAtMousePos(mousePos: Vector2d | null): ShipElement | undefined {
  //   if (!mousePos) {
  //     return undefined;
  //   }
  //   const gridCoords = this.posToGridCoords(mousePos);
  //   return this.shipElements()[gridCoords.x][gridCoords.y];
  // }

  addRoomAtPos(pos: Vector2d | null): void {
    if (!pos) {
      return;
    }

    const snappedCoords = this.posSnappedToGrid(pos);

    if (this.hullRectConfigs().find((rect) => rect.x() === snappedCoords.x && rect.y() === snappedCoords.y)) {
      return;
    }
    
    this.addRect(snappedCoords);
  }

  removeRoomAtPos(pos: Vector2d | null): void {
    if (!pos) {
      return;
    }

    const gridCoords = this.posToGridCoords(pos);

    this.hullRectConfigs.update((rects) => {
      const rect = rects.find((rect) => rect.x() === gridCoords.x && rect.y() === gridCoords.y);
      if (rect) {
        rect.destroy();
        return rects.filter((r) => r !== rect);
      }
      return rects;
    });

    // if (this.shipElements()[gridCoords.x][gridCoords.y] !== undefined) {
    //   this.shipElements.update((shipElements) => {
    //     shipElements[gridCoords.x][gridCoords.y] = undefined;
    //     return shipElements;
    //   });
    // }
  }

  clearEditor(): void {
    this.hullRectConfigs.set([]);
    this.shipElementShapes.set([]);
    this.initShipElements();
  }

  addRect(pos: Vector2d | null): void {
    if (!pos) {
      return;
    }

    const newRectConfig = {
      name: 'rect',
      x: pos.x,
      y: pos.y,
      width: this.gridBlockSize(),
      height: this.gridBlockSize(),
      fill: '#808080',
      stroke: '#fffff',
      strokeWidth: 1,
    } as RectConfig;

    this.hullRectConfigs.update((rects) => {
      rects.push(new Rect(newRectConfig));
      return rects;
    });
  }

  bringToFront(shape: ShipElementShape | Shape): void {
    shape.show();
    shape.moveToTop();
  }

  snapToGrid(shape: Shape): void {
    shape.position({
      x: Math.round(shape.x() / this.gridBlockSize()) * this.gridBlockSize(),
      y: Math.round(shape.y() / this.gridBlockSize()) * this.gridBlockSize(),
    });
  }

  posSnappedToGrid(pos: Vector2d): Vector2d {
    return {
      x: Math.floor(pos.x / this.gridBlockSize()) * this.gridBlockSize(),
      y: Math.floor(pos.y / this.gridBlockSize()) * this.gridBlockSize(),
    };
  }

  posToGridCoords(pos: Vector2d): Vector2d {
    return { x: Math.floor(pos.x / this.gridBlockSize()), y: Math.floor(pos.y / this.gridBlockSize()) };
  }
}
