import {
  AfterViewInit,
  Component,
  effect,
  input,
  model,
  OnInit,
  signal,
  Signal,
  viewChild,
  viewChildren,
  WritableSignal,
} from '@angular/core';
import { CoreShapeComponent, NgKonvaEventObject, StageComponent } from 'ng2-konva';
import { StageConfig } from 'konva/lib/Stage';
import { Rect, RectConfig } from 'konva/lib/shapes/Rect';
import { Shape } from 'konva/lib/Shape';
import { EditorTool } from '../../models/editor-tool.enum';
import { Vector2d } from 'konva/lib/types';
import { ShipElement } from '../../models/ship-element';
import { Image, ImageConfig } from 'konva/lib/shapes/Image';
import { ShipElementShape } from '../../models/ship-element-shape';
import { KoShipElementComponent } from '../ko-ship-element/ko-ship-element.component';
import { Transformer, TransformerConfig } from 'konva/lib/shapes/Transformer';

@Component({
  selector: 'app-ship-editor',
  standalone: true,
  imports: [StageComponent, CoreShapeComponent, KoShipElementComponent],
  templateUrl: './ship-editor.component.html',
  styleUrl: './ship-editor.component.scss',
  //changeDetection: ChangeDetectionStrategy.OnPush, //TODO check if this is causing bugs
})
export class ShipEditorComponent implements OnInit, AfterViewInit {
  stage = viewChild.required(StageComponent);
  gridLayer: Signal<CoreShapeComponent> = viewChild.required('gridLayer');
  designLayer: Signal<CoreShapeComponent> = viewChild.required('designLayer');
  shipElementsLayer: Signal<CoreShapeComponent> = viewChild.required('shipElementsLayer');
  selector: Signal<CoreShapeComponent> = viewChild.required('selector');

  /**
   * The ship element images that are currently created on the canvas
   */
  shipElementImages: Signal<readonly CoreShapeComponent[]> = viewChildren('shipElementImage');

  gridRectConfigs: WritableSignal<Array<RectConfig>> = signal([]);
  hullRectConfigs: WritableSignal<Array<Array<RectConfig | undefined>>> = signal([]);
  shipElementShapes: WritableSignal<Array<ShipElementShape>> = signal([]);

  /**
   * The ShipElement image currently being held by the user (with a mouse drag).
   */
  currentlyHeldShipElement = input<ShipElement>();

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
  gridBlockSize = model.required<number>();

  /**
   * Whether the grid is enabled.
   */
  gridEnabled = input<boolean>();

  /**
   * The currently selected tool.
   */
  selectedTool = input<EditorTool>(EditorTool.NONE);

  /**
   * The initial stage scaling (ex: 0.90)
   */
  initialStageScale = input.required<number>();

  /**
   * How quickly the zooming occurs (per scroll wheel event, ex: 1.05) -> must be above 1
   */
  zoomScaleBy = input.required<number>();

  /**
   * Computed total tactical value of all ship elements on the canvas.
   */
  // totalTV: Signal<number> = computed(() => {
  //   let total = 0;
  //   this.shipElementShapes().forEach((shape: ShipElementShape) => {
  //     total += shape.shipElement.tacticalValue;
  //   });
  //   return total;
  // });
  public totalTV: number = 0;

  public configStage: Partial<StageConfig> = {};
  public transformConfig: Partial<TransformerConfig> = {
    resizeEnabled: false,
    rotateEnabled: true,
    rotationSnaps: [0, 90, 180, 270],
    rotationSnapTolerance: 45,
    rotateAnchorOffset: 50,
  };

  private dragging: boolean = false;
  private selectedShape: Shape | undefined = undefined;
  private selectedElementStartPos: Vector2d | undefined = undefined;

  private currentStagePos: Vector2d = { x:0, y:0 } as Vector2d;
  private currentScale: number = 1.0;

  constructor() {
    effect(() => {
      if (this.gridEnabled()) {
        this.gridLayer().getStage().show();
      } else {
        this.gridLayer().getStage().hide();
      }
    });
  }

  ngOnInit(): void {
    // Initialize stage
    this.configStage = {
      width: this.editorWidth(),
      height: this.editorHeight(),
      draggable: false,
    };

    this.initGrid();
    this.initHullRectArray();
  }

  ngAfterViewInit(): void {
    //Apply initial zoom level
    this.stage().getStage().scale({ x: this.initialStageScale(), y: this.initialStageScale() });
    this.currentScale = this.initialStageScale();
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
   * Initializes a 2D array of hull rects
   */
  private initHullRectArray(): void {
    for (let x = 0; x <= this.editorWidth(); x += this.gridBlockSize()) {
      this.hullRectConfigs.update((hullRectConfigs) => [
        ...hullRectConfigs,
        new Array<ShipElement | undefined>(this.editorHeight() / this.gridBlockSize()),
      ]);
    }

    // init all elements to undefined
    for (let x = 0; x < this.editorWidth(); x += this.gridBlockSize()) {
      for (let y = 0; y < this.editorHeight(); y += this.gridBlockSize()) {
        this.hullRectConfigs.update((hullRectConfigs) => {
          hullRectConfigs[x / this.gridBlockSize()][y / this.gridBlockSize()] = undefined;
          return hullRectConfigs;
        });
      }
    }
  }

  onStageScroll(ngEventObj: NgKonvaEventObject<WheelEvent>): void {
    if (!ngEventObj.event) {
      return;
    }
    
    const evt = ngEventObj.event.evt;
    evt.preventDefault();

    const stage = this.stage().getStage();
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    if (!pointer) {
      return;
    }

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    // Zoom direction
    let direction = evt.deltaY > 0 ? 1 : -1;

    // when we zoom on trackpad, e.evt.ctrlKey is true
    // In this case, reverse direction of zooming
    if (evt.ctrlKey) {
      direction = -direction;
    }

    const newScale = direction > 0 ? oldScale * this.zoomScaleBy() : oldScale / this.zoomScaleBy();
    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    stage.scale({ x: newScale, y: newScale });
    stage.position(newPos);

    this.currentScale = newScale;
    this.currentStagePos = newPos;

    //NOTE: block size does not need to be scaled as the whole stage is acting as a different size,
    // so if we scale by half, the pixels are half the size essentially.
  }

  onToolStageDragStart(ngEvent: NgKonvaEventObject<MouseEvent>): void {
    this.dragging = true;

    if (!ngEvent.event) {
      return;
    }

    switch (this.selectedTool()) {
      case EditorTool.BRUSH:
        this.addRoomAtPos(this.getScaledPosition(this.stage().getStage().getPointerPosition()));
        break;
      case EditorTool.ERASER:
        this.removeRoomAtPos(this.getScaledPosition(this.stage().getStage().getPointerPosition()));
        break;
      case EditorTool.NONE:
        if (ngEvent.event.target !== this.stage().getStage()) {
          const shape = ngEvent.event.target as Shape;

          if (shape) {
            if (shape instanceof Image) {
              this.bringToFront(shape);
              (this.selector().getStage() as Transformer).nodes([shape]);
  
              this.selectedElementStartPos = { x: shape.x(), y: shape.y() } as Vector2d;
              this.selectedShape = shape;
            }
          }
        } else if (ngEvent.event.target === this.stage().getStage()) {
          // Deselect elements if click on empty space
          (this.selector().getStage() as Transformer).nodes([]);
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
          this.addRoomAtPos(this.getScaledPosition(this.stage().getStage().getPointerPosition()));
          break;
        case EditorTool.ERASER:
          this.removeRoomAtPos(this.getScaledPosition(this.stage().getStage().getPointerPosition()));
          break;
        case EditorTool.NONE:
          if (this.selectedShape) {
            this.selectedShape.position({
              x: this.selectedShape.x() + ngEvent.event.evt.movementX / this.currentScale,
              y: this.selectedShape.y() + ngEvent.event.evt.movementY / this.currentScale,
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
      if (this.selectedShape) {

        // Validate placement of element
        // check if element is placed on top of another element
        // Search for another element at the same position in the shipElementShapes array

        this.snapToGrid(this.selectedShape);
      }

      this.selectedShape = undefined;

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

    let pos = this.getScaledPosition(this.stage().getStage().getPointerPosition());
    if (pos === null) {
      return;
    }

    const heldShipElement = this.currentlyHeldShipElement();
    if (heldShipElement) {
      const gridSnappedPos = this.posSnappedToGrid(pos);

      const img = document.createElement('img');
      const imageUrl = heldShipElement.imageUrl;
      if (imageUrl !== undefined) {
        img.src = imageUrl;
      }
      let image: ImageConfig = {
        name: 'image',
        image: img,
        x: gridSnappedPos.x,
        y: gridSnappedPos.y,
      };
  
      this.addShipElement(heldShipElement, image);
    }
  }

  addRoomAtPos(pos: Vector2d | null): void {
    if (!pos) {
      return;
    }

    const gridCoords = this.posToGridCoords(pos);

    if (this.hullRectConfigs()[gridCoords.x][gridCoords.y] === undefined) {
      this.addRect(pos);
    }
  }

  removeRoomAtPos(pos: Vector2d | null): void {
    if (!pos) {
      return;
    }

    const gridCoords = this.posToGridCoords(pos);

    if (this.hullRectConfigs()[gridCoords.x][gridCoords.y] !== undefined) {
      this.hullRectConfigs.update((hullRectConfigs) => {
        hullRectConfigs[gridCoords.x][gridCoords.y] = undefined;
        return hullRectConfigs;
      });
    }
  }

  clearEditor(): void {
    this.hullRectConfigs.set([]);
    this.shipElementShapes.set([]);
    this.totalTV = 0;
    (this.selector().getStage() as Transformer).nodes([]);
    this.initHullRectArray();
  }

  addRect(pos: Vector2d | null): void {
    if (!pos) {
      return;
    }

    const gridSnappedPos = this.posSnappedToGrid(pos);
    const gridCoords = this.posToGridCoords(gridSnappedPos);

    const newRectConfig = {
      name: 'rect',
      x: gridSnappedPos.x,
      y: gridSnappedPos.y,
      width: this.gridBlockSize(),
      height: this.gridBlockSize(),
      fill: '#CDCDCD',
      stroke: '#fffff',
      strokeWidth: 2,
    } as RectConfig;

    this.hullRectConfigs.update((hullRectConfigs) => {
      hullRectConfigs[gridCoords.x][gridCoords.y] = newRectConfig;
      return hullRectConfigs;
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

  getScaledPosition(pos: Vector2d | null): Vector2d | null {
    if (!pos) {
      return null;
    }

    // transform the mouse pos relative to the origin of the stage and scale it by the stage's current scale
    return { x: (pos.x - this.currentStagePos.x) / this.currentScale, y: (pos.y - this.currentStagePos.y) / this.currentScale } as Vector2d;;
  }

  addShipElement(shipElement: ShipElement, imageConfig: ImageConfig ): void {
    if (!imageConfig.x || !imageConfig.y) {
      console.log('error: imageConfig missing x or y');
      return;
    }

    const gridCoords = this.posToGridCoords({x: imageConfig.x, y: imageConfig.y});
    const newShipElementShape = new ShipElementShape(shipElement, gridCoords, imageConfig);

    this.shipElementShapes.update((shipElementShapes) => {
      shipElementShapes.push(newShipElementShape);
      return shipElementShapes;
    });

    this.totalTV += shipElement.tacticalValue;
  }
}
