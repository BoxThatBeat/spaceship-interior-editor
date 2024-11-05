import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
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
import { Transformer, TransformerConfig } from 'konva/lib/shapes/Transformer';
import { ContextMenuComponent } from "../context-menu/context-menu.component";
import { v4 as uuidv4 } from 'uuid';
import ArmamentDetailsService from '../../services/armament-details.service';
import { GroupConfig } from 'konva/lib/Group';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ship-editor',
  standalone: true,
  imports: [StageComponent, CoreShapeComponent, ContextMenuComponent, FormsModule],
  templateUrl: './ship-editor.component.html',
  styleUrl: './ship-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush, //TODO check if this is causing bugs
})
export class ShipEditorComponent implements OnInit, AfterViewInit {

  // ----------------- VIEW CHILDREN -----------------
  public stage = viewChild.required(StageComponent);
  public gridLayer: Signal<CoreShapeComponent> = viewChild.required('gridLayer');
  public designLayer: Signal<CoreShapeComponent> = viewChild.required('designLayer');
  public shipElementsLayer: Signal<CoreShapeComponent> = viewChild.required('shipElementsLayer');
  public selector: Signal<CoreShapeComponent> = viewChild.required('selector');

  /**
   * The ship element images that are currently created on the canvas TODO: is this needed?
   */
  public shipElementImages: Signal<readonly CoreShapeComponent[]> = viewChildren('shipElementImage');

  // ----------------- SIGNALS -----------------
  // These two signals are the app's main state (changes made by the user)
  //TODO: move each signal into its own service along with all the logic that acts on it
  public hullRectConfigs: WritableSignal<Array<Array<RectConfig | null>>> = signal([], {equal: () => false });
  public shipElementShapes: WritableSignal<Array<ShipElementShape>> = signal([], {equal: () => false });

  public gridRectConfigs: WritableSignal<Array<RectConfig>> = signal([]);
  public doorRectConfigs: WritableSignal<Array<RectConfig>> = signal([]);
  public doorRectShadowConfig: WritableSignal<RectConfig> = signal({} as RectConfig);

  public contextMenuVisible = signal(false);
  public contextMenuTopPosPx = signal(0);
  public contextMenuLeftPosPx = signal(0);

  public shipTitle = signal('');

  // ----------------- KONVA CONFIGS -----------------
  public configStage: Partial<StageConfig> = {};
  public transformConfig: TransformerConfig = {
    resizeEnabled: false,
    rotateEnabled: true,
    rotationSnaps: [0, 90, 180, 270],
    rotationSnapTolerance: 45,
    rotateAnchorOffset: 50,
  };
  public readonly armamentGroupConfig: GroupConfig = {
    x: 100,
    y: 100,
    draggable: true,
  } as GroupConfig

  // ----------------- INPUT VARIABLES -----------------
  /**
   * The ShipElement image currently being held by the user (with a mouse drag).
   */
  currentlyHeldShipElement = input<ShipElement>();

  /**
   * Width of the editor in px.
   */
  editorWidth = input.required<number>();

  /**
   * Height of the editor in px.
   */
  editorHeight = input.required<number>();

  /**
   * The size of each grid block side in pixels.
   */
  gridBlockSize = input.required<number>();

  /**
   * The number of grid squares that make up the width
   */
  gridWidth = input.required<number>();

  /**
   * The number of grid squares that make up the height
   */
  gridHeight = input.required<number>();

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

  // ----------------- COMPUTED SIGNALS -----------------
  gridWidthPx = computed(() => this.gridWidth() * this.gridBlockSize());
  gridHeightPx = computed(() => this.gridHeight() * this.gridBlockSize());
  totalCost: Signal<number> = computed(() => {
    let total = 0;
    this.shipElementShapes().forEach((shape: ShipElementShape) => {
      total += shape.shipElement.tacticalValue;
    });

    this.hullRectConfigs().forEach((row) => {
      row.forEach((rect) => {
        if (rect) {
          total += 10;
        }
      });
    });
    return total;
  });

  // ----------------- PRIVATE VARIABLES -----------------
  private dragging: boolean = false;
  private middleMouseHeld: boolean = false;
  private selectedShape: Shape | undefined = undefined;
  private selectedElementStartPos: Vector2d | undefined = undefined;
  private rightClickedShipElementId: string = '';

  // SERVICES
  public armamentDetailsService = inject(ArmamentDetailsService);

  // ----------------- INITIALIZERS -----------------
  constructor() {
    effect(() => {
      if (this.gridEnabled()) {
        this.gridLayer().getStage().show();
      } else {
        this.gridLayer().getStage().hide();
      }
    });

    effect(() => {
      localStorage.setItem('hullRectConfigsJson', JSON.stringify(this.hullRectConfigs()));
    });

    effect(() => {
      localStorage.setItem('shipElementShapesJson', JSON.stringify(this.shipElementShapes()));
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
    this.loadSavedState();
  }

  /**
   * Initializes the grid layer with a grid of rectangles.
   */
  private initGrid(): void {
    for (let x = 0; x < this.gridWidth(); x++) {
      for (let y = 0; y < this.gridHeight(); y++) {
        this.gridRectConfigs.update((rects) => [
          ...rects,
          {
            x: x * this.gridBlockSize(),
            y: y * this.gridBlockSize(),
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
    for (let x = 0; x <= this.gridWidth(); x++) {
      this.hullRectConfigs.update((hullRectConfigs) => [
        ...hullRectConfigs,
        new Array<ShipElement | null>(this.gridHeight()),
      ]);
    }

    // init all elements to null
    for (let x = 0; x < this.gridWidth(); x++) {
      for (let y = 0; y < this.gridHeight(); y++) {
        this.hullRectConfigs.update((hullRectConfigs) => {
          hullRectConfigs[x][y] = null;
          return hullRectConfigs;
        });
      }
    }
  }

  // ----------------- EVENT HANDLERS -----------------

  /**
   * Handles the scroll event on the stage. Zooms in and out by scaling the stage.
   */
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
    let direction = evt.deltaY > 0 ? -1 : 1;

    // when we zoom on trackpad, e.evt.ctrlKey is true
    // In this case, reverse direction of zooming
    // if (evt.ctrlKey) {
    //   direction = -direction;
    // }

    const newScale = direction > 0 ? oldScale * this.zoomScaleBy() : oldScale / this.zoomScaleBy();
    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    stage.scale({ x: newScale, y: newScale });
    stage.position(newPos);
  }

  /**
   * Handles opening the context menu on the stage when the user right-clicks -> gives option to duplicate or delete ship element
   */
  onStageContextMenu(ngEventObj: NgKonvaEventObject<PointerEvent>) {
    if (!ngEventObj.event) {
      return;
    }
    
    const event = ngEventObj.event;
    event.evt.preventDefault();

    const stage = this.stage().getStage();
    const pointerPos = stage.getPointerPosition();
    const containerRect = stage.container().getBoundingClientRect();

    if (!pointerPos) {
      return;
    }

    if (event.target === this.stage().getStage()) {
      return;
    }

    if (event.target instanceof Rect) {
      return;
    }

    // Set the selected ship element in case an action is performed on it
    this.rightClickedShipElementId = (event.target as Shape).name();

    this.contextMenuVisible.set(true);
    this.contextMenuTopPosPx.set(containerRect.top + pointerPos.y + 4);
    this.contextMenuLeftPosPx.set(containerRect.left + pointerPos.x + 4);
  }

  /**
   * Handles the context menu duplicate button being pressed. Duplicates the right-clicked ship element.
   */
  onContextMenuDuplicateBtnPressed() {
    const elementToDuplicate = this.shipElementShapes().find((shape) => shape.shipElementId === this.rightClickedShipElementId);
    if (!elementToDuplicate) {
      return;
    }

    // Make copy of element
    const elementCopy = { ... elementToDuplicate.shipElement } as ShipElement;

    let pos = this.getScaledPosition(this.stage().getStage().getPointerPosition());
    if (pos === null) {
      return;
    }

    const gridSnappedPos = this.posSnappedToGrid(pos);
    // Move over by 2 grid block
    gridSnappedPos.x += this.gridBlockSize() * 2;

    const img = document.createElement('img');
    const imageUrl = elementCopy.imageUrl;
    if (!imageUrl) {
      return;
    }
    img.src = imageUrl;

    const shipElementId = uuidv4();
    let image: ImageConfig = {
      name: shipElementId,
      image: img,
      x: gridSnappedPos.x,
      y: gridSnappedPos.y,
    };

    this.addShipElement(shipElementId, elementCopy, image);
  }

  /**
   * Handles the context menu delete button being pressed. Deletes the right-clicked ship element.
   */
  onContextMenuDeleteBtnPressed() {
    const shipElementToDelete = this.shipElementShapes().find((shape) => shape.shipElementId === this.rightClickedShipElementId)?.shipElement;
    if (!shipElementToDelete) {
      return;
    }

    this.armamentDetailsService.removeShipElement(shipElementToDelete);

    // Delete ship element with rightClickedShipElementId
    this.shipElementShapes.update((shipElementShapes) => {
      return shipElementShapes.filter((shape) => shape.shipElementId !== this.rightClickedShipElementId);
    });

    //TODO: fix bug that all ship elements after the one deleted get random rotations if the rotation was changed
    // THis might have to do with the fact that the shapes are recreated and it stores the rotation not the grid config 

    // Deselect element
    (this.selector().getStage() as Transformer).nodes([]);

    // Close menu
    this.contextMenuVisible.set(false);
  }

  /**
   * Handles a click on the stage. Does a multitude of things depending on the selected tool.
   */
  onToolStageDragStart(ngEvent: NgKonvaEventObject<MouseEvent>): void {
    this.dragging = true;
    this.contextMenuVisible.set(false);

    if (!ngEvent.event) {
      return;
    }

    // prevent default behavior
    ngEvent.event.evt.preventDefault();

    // if the user is dragging the stage with the middle mouse button
    if (ngEvent.event.evt.button === 1) {
      this.middleMouseHeld = true;
      return;
    }

    switch (this.selectedTool()) {
      case EditorTool.BRUSH:
        this.useBrushTool();
        break;
      case EditorTool.ERASER:
        this.useEraserTool();
        break;
      case EditorTool.DOOR:
        this.useDoorTool();
        break;
      case EditorTool.NONE:
        if (ngEvent.event.target === this.stage().getStage()) {
          (this.selector().getStage() as Transformer).nodes([]);
        } else {
          const shape = ngEvent.event.target as Shape;

          if (shape && shape instanceof Image) {
            shape.moveToTop();
            (this.selector().getStage() as Transformer).nodes([shape]);

            this.selectedElementStartPos = { x: shape.x(), y: shape.y() } as Vector2d;
            this.selectedShape = shape;
          }
        }
        break;
    }
  }

  /**
   * Handles a dragging of the mouse while holding down a mouse button. Does a multitude of things depending on the selected tool.
   */
  onToolStageDragMove(ngEvent: NgKonvaEventObject<MouseEvent>): void {
    if (!ngEvent.event) {
      return;
    }

    // prevent default behavior
    ngEvent.event.evt.preventDefault();

    if (this.dragging) {

      const stage = this.stage().getStage();
      if (this.middleMouseHeld) {

        // set the position of the stage based on the mouse position
        const pos = stage.position();
        const newPos = {
          x: pos.x + ngEvent.event.evt.movementX,
          y: pos.y + ngEvent.event.evt.movementY,
        };
        stage.position(newPos);
        return;
      }

      switch (this.selectedTool()) {
        case EditorTool.BRUSH:
          this.useBrushTool();
          break;
        case EditorTool.ERASER:
          this.useEraserTool();
          break;
        case EditorTool.DOOR:
          this.useDoorTool();
          break;
        case EditorTool.NONE:
          if (this.selectedShape) {

            const newX = this.selectedShape.x() + ngEvent.event.evt.movementX / stage.scaleX();
            const newY = this.selectedShape.y() + ngEvent.event.evt.movementY / stage.scaleY();
            
            if (this.isWithinGridBounds({ x: newX, y: newY } as Vector2d, this.selectedShape.width(), this.selectedShape.height())) {
              this.selectedShape.position({
                x: newX,
                y: newY,
              });
            }
          }
          break;
      }
    }
  }

  onStageHover(ngEvent: NgKonvaEventObject<MouseEvent>) {
    if (!ngEvent.event) {
      return;
    }

    if (this.selectedTool() === EditorTool.DOOR) {
      this.placeDoorShadowAtPos(this.getScaledPosition(this.stage().getStage().getPointerPosition()));
    }
  }

  onStageHoverLeave(ngEvent: NgKonvaEventObject<MouseEvent>) {
    this.doorRectShadowConfig.set({} as RectConfig);
  }

  /**
   * Use the brush tool to add hull squares to the grid.
   */
  useBrushTool() {
    const mousePos = this.getScaledPosition(this.stage().getStage().getPointerPosition());
    if (this.isWithinGridBounds(mousePos)) {
      this.addHullAtPos(mousePos);
    }
  }

  /**
   * Use the eraser tool to remove hull squares from the grid.
   */
  useEraserTool() {
    this.removeHullAtPos(this.getScaledPosition(this.stage().getStage().getPointerPosition()));
  }

  /**
   * Use the door tool to add doors to ship hulls.
   */
  useDoorTool() {
    const mousePos = this.getScaledPosition(this.stage().getStage().getPointerPosition());
    if (this.isWithinGridBounds(mousePos)) {
      this.addDoorAtPos(mousePos);
    }
  }

  /**
   * Handles the end of a drag event on the stage. Does a multitude of things depending on the selected tool.
   */
  onToolStageDragEnd(ngEvent: NgKonvaEventObject<MouseEvent>): void {
    this.dragging = false;

    if (!ngEvent.event) {
      return;
    }

    if (this.middleMouseHeld) {
      this.middleMouseHeld = false;
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

  /**
   * Handles when an image is being dragged over the container. Prevents default behavior (which prevents the image from being dropped).
   */
  onContainerDragOver(event: any) {
    // Prevent normal behavior of dragging an image over the container
    event.preventDefault();
  }

  /**
   * Handles when the ship title text input changes (char by char).
   */
  onShipTitleChanged() {
    this.armamentDetailsService.updateShipTitle(this.shipTitle());
  }

  // ----------------- KONVA CANVAS MODIFIERS -----------------

  /**
   * Handles when an image is dropped onto the container. Creates a new ship element image on the canvas.
   */
  onImageDropped(event: any) {
    event.preventDefault();

    // register event position
    this.stage().getStage().setPointersPositions(event);

    let mousePos = this.getScaledPosition(this.stage().getStage().getPointerPosition());
    if (mousePos === null) {
      return;
    }

    const heldShipElement = this.currentlyHeldShipElement();
    if (!heldShipElement) {
      return;
    }

    const gridSnappedPos = this.posSnappedToGrid(mousePos);

    if (this.isWithinGridBounds(mousePos)) {
      const img = document.createElement('img');
      const imageUrl = heldShipElement.imageUrl;
      if (!imageUrl) {
        return;
      }
      img.src = imageUrl;

      const shipElementId = uuidv4();
      let image: ImageConfig = {
        name: shipElementId,
        image: img,
        x: gridSnappedPos.x,
        y: gridSnappedPos.y,
      };

      this.addShipElement(shipElementId, heldShipElement, image);
    } else {
      console.log('error: image dropped outside of grid bounds');
      //TODO: show error banner with service
    }
  }

  /**
   * Adds a hull square at the given position.
   */
  addHullAtPos(pos: Vector2d | null): void {
    if (!pos) {
      return;
    }

    const gridSnappedPos = this.posSnappedToGrid(pos);
    const gridCoords = this.posToGridCoords(gridSnappedPos);

    // Prevent overlapping hull squares
    if (this.hullRectConfigs()[gridCoords.x][gridCoords.y] !== null) {
      return;
    }

    const newRectConfig = {
      x: gridSnappedPos.x,
      y: gridSnappedPos.y,
      width: this.gridBlockSize(),
      height: this.gridBlockSize(),
      fill: '#CDCDCD',
      stroke: '#fffff',
      strokeWidth: 4,
    } as RectConfig;

    this.hullRectConfigs.update((hullRectConfigs) => {
      hullRectConfigs[gridCoords.x][gridCoords.y] = newRectConfig;
      return hullRectConfigs;
    });
  }

  /**
   * Removes a hull square at the given position.
   */
  removeHullAtPos(pos: Vector2d | null): void {
    if (!pos) {
      return;
    }

    const gridCoords = this.posToGridCoords(pos);

    if (this.hullRectConfigs()[gridCoords.x][gridCoords.y] !== null) {
      this.hullRectConfigs.update((hullRectConfigs) => {
        hullRectConfigs[gridCoords.x][gridCoords.y] = null;
        return hullRectConfigs;
      });
    }
  }

  placeDoorShadowAtPos(pos: Vector2d | null): void {
    if (!pos) {
      return;
    }

    //TODO: move to property
    const doorWidth = 50;
    const doorHeight = 200;

    // get position snapped to grid
    const gridSnappedPos = this.posSnappedToGrid(pos);

    // calculate how close the mouse is to the top, bottom, left, or right of the grid block
    const xDiff = pos.x % this.gridBlockSize();
    const yDiff = pos.y % this.gridBlockSize();

    const distanceToRightEdge = this.gridBlockSize() - xDiff;
    const distanceToLeftEdge = xDiff; 
    const distanceToBottomEdge = this.gridBlockSize() - yDiff;
    const distanceToTopEdge = yDiff;

    // log the direction with the shortest distance
    const closestDistance = Math.min(distanceToLeftEdge, distanceToRightEdge, distanceToTopEdge, distanceToBottomEdge);
    
    switch(closestDistance) {
      case distanceToLeftEdge:
        this.doorRectShadowConfig.set({
          x: gridSnappedPos.x - doorWidth / 2,
          y: gridSnappedPos.y + this.gridBlockSize() / 2 - doorHeight / 2,
          width: doorWidth,
          height: doorHeight,
          fill: '#CDCDCD',
          stroke: '#fffff',
          strokeWidth: 10,
        } as RectConfig);
        break;
      case distanceToRightEdge:
        this.doorRectShadowConfig.set({
          x: gridSnappedPos.x + this.gridBlockSize() - doorWidth / 2,
          y: gridSnappedPos.y + this.gridBlockSize() / 2 - doorHeight / 2,
          width: doorWidth,
          height: doorHeight,
          fill: '#CDCDCD',
          stroke: '#fffff',
          strokeWidth: 10,
        } as RectConfig);
        break;
      case distanceToTopEdge:
        this.doorRectShadowConfig.set({
          x: gridSnappedPos.x + this.gridBlockSize() / 2 - doorHeight / 2,
          y: gridSnappedPos.y - doorWidth / 2,
          width: doorHeight,
          height: doorWidth,
          fill: '#CDCDCD',
          stroke: '#fffff',
          strokeWidth: 10,
        } as RectConfig);
        break;
      case distanceToBottomEdge:
        this.doorRectShadowConfig.set({
          x: gridSnappedPos.x + this.gridBlockSize() / 2 - doorHeight / 2,
          y: gridSnappedPos.y + this.gridBlockSize() - doorWidth / 2,
          width: doorHeight,
          height: doorWidth,
          fill: '#CDCDCD',
          stroke: '#fffff',
          strokeWidth: 10,
        } as RectConfig);
        break;
    }
  }

  addDoorAtPos(pos: Vector2d | null): void {
    if (!pos) {
      return;
    }

    console.log('adding door');

  }

  /**
   * Adds a ship element with the given id and image to the editor.
   */
  addShipElement(id: string, shipElement: ShipElement, imageConfig: ImageConfig ): void {
    if (!imageConfig.x || !imageConfig.y) {
      console.log('error: imageConfig missing x or y');
      return;
    }

    this.armamentDetailsService.addShipElement(shipElement);

    const gridCoords = this.posToGridCoords({x: imageConfig.x, y: imageConfig.y});
    const newShipElementShape = new ShipElementShape(id, shipElement, gridCoords, imageConfig);

    this.shipElementShapes.update((shipElementShapes) => {
      shipElementShapes.push(newShipElementShape);
      return shipElementShapes;
    });
  }

  /**
   * Handles the clear editor button
   */
  clearEditor(): void {
    this.hullRectConfigs.set([]);
    this.shipElementShapes.set([]);
    (this.selector().getStage() as Transformer).nodes([]);
    this.initHullRectArray();
    this.armamentDetailsService.clearShipElements();
  }

  // ----------------- HELPER FUNCTIONS -----------------

  /**
   * Snaps the given shape to the grid.
   */
  snapToGrid(shape: Shape): void {
    shape.position({
      x: Math.round(shape.x() / this.gridBlockSize()) * this.gridBlockSize(),
      y: Math.round(shape.y() / this.gridBlockSize()) * this.gridBlockSize(),
    });
  }

  /**
   * Returns the given position snapped to the grid.
   */
  posSnappedToGrid(pos: Vector2d): Vector2d {
    return {
      x: Math.floor(pos.x / this.gridBlockSize()) * this.gridBlockSize(),
      y: Math.floor(pos.y / this.gridBlockSize()) * this.gridBlockSize(),
    };
  }

  /**
   * Returns the grid coordinates of the given position (not px)
   */
  posToGridCoords(pos: Vector2d): Vector2d {
    return { x: Math.floor(pos.x / this.gridBlockSize()), y: Math.floor(pos.y / this.gridBlockSize()) };
  }

  /**
   * Returns the position transformed and scaled to the stage's current position and scale
   */
  getScaledPosition(pos: Vector2d | null): Vector2d | null {
    if (!pos) {
      return null;
    }
    const stage = this.stage().getStage();

    // transform the mouse pos relative to the origin of the stage and scale it by the stage's current scale
    return { x: (pos.x - stage.getPosition().x) / stage.scaleX(), y: (pos.y - stage.getPosition().y) / stage.scaleY() } as Vector2d;;
  }

  /**
   * Returns whether the given position is within the bounds of the grid.
   */
  isWithinGridBounds(pos: Vector2d | null, width?: number, height?: number): boolean {
    if (!pos) {
      return false;
    }
    if (width && height) {
      return pos.x >= 0 && pos.x + width <= this.gridWidthPx() && pos.y >= 0 && pos.y + height <= this.gridHeightPx();
    }
    return pos.x >= 0 && pos.x <= this.gridWidthPx() && pos.y >= 0 && pos.y <= this.gridHeightPx();
  }

  /**
   * Loads the saved state from local storage. (the editor will not lose progress upon tab reload)
   */
  loadSavedState() {
    const hullRectConfigsJson = localStorage.getItem('hullRectConfigsJson');
    if (hullRectConfigsJson) {
      this.hullRectConfigs.set(JSON.parse(hullRectConfigsJson));
    }

    const shipElementShapesJson = localStorage.getItem('shipElementShapesJson');
    if (shipElementShapesJson) {
      
      //TODO: reapply rotations since they get lost since not stored in the image config. Could implement your own rotation by having 4 images per gun
      // for each shipElementShape create a new img as the serialization process removes the image property (DOM element)
      const shipElementShapes = JSON.parse(shipElementShapesJson);
      shipElementShapes.forEach((shape: ShipElementShape) => {
        const img = document.createElement('img');
        const imageUrl = shape.shipElement.imageUrl;
        if (imageUrl) {
          img.src = imageUrl;
        }
        shape.config = { ...shape.config, image: img } as ImageConfig;
      });

      this.shipElementShapes.set(shipElementShapes);
    }
  }
}
