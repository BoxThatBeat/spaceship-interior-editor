import { Component, effect, input, OnInit, signal, Signal, viewChild, WritableSignal } from '@angular/core';
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
export class ShipEditorComponent implements OnInit {
  stage = viewChild.required(StageComponent);
  gridLayer: Signal<CoreShapeComponent> = viewChild.required('gridLayer');
  designLayer: Signal<CoreShapeComponent> = viewChild.required('designLayer');

  gridRectConfigs: WritableSignal<Array<RectConfig>> = signal([]);
  shipElements: WritableSignal<Array<Array<ShipElement | undefined>>> = signal([]);

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

  private dragging: boolean = false;

  constructor() {
    // effect(() => {
    //   if (this.selectedTool() !== EditorTool.NONE) {
    //     this.removeStageListeners();
    //     this.stage()
    //       .getStage()
    //       .on('mousedown', (event) => this.onToolStageDragStart(event));
    //     this.stage()
    //       .getStage()
    //       .on('mouseup', (event) => this.onToolStageDragEnd(event));
    //     this.stage()
    //       .getStage()
    //       .on('mousemove', (event) => this.onToolStageDragMove(event));
    //   } else {
    //     this.removeStageListeners();
    //     this.stage()
    //       .getStage()
    //       .on('mousedown', (event) => this.onToolStageDragStart(event));
    //     this.stage()
    //       .getStage()
    //       .on('mouseup', (event) => this.onToolStageDragEnd(event));
    //     this.stage()
    //       .getStage()
    //       .on('mousemove', (event) => this.onToolStageDragMove(event));
    //   }
    // });

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

    //Test
    this.addRoomAtPos({ x: 100, y: 100 });
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

  onRectDragStart(ngEvent: NgKonvaEventObject<MouseEvent>): void {
    this.dragging = true;

    if (!ngEvent.event) {
      return;
    }

    if (this.selectedTool() === EditorTool.NONE) {
      this.bringToFront(ngEvent.event.target as Shape);
      //TODO: set the rect as the selected rectangle and only modify it so that others are not selected. Also add a shadow rect to show where the rect will be placed
    }
  }

  onRectDragEnd(ngEvent: NgKonvaEventObject<MouseEvent>): void {
    this.dragging = false;

    if (!ngEvent.event) {
      return;
    }

    if (this.selectedTool() === EditorTool.NONE) {
      this.snapToGrid(ngEvent.event.target as Shape);
    }
  }

  onRectDragMove(ngEvent: NgKonvaEventObject<MouseEvent>): void {
    if (!ngEvent.event) {
      return;
    }

    if (this.selectedTool() === EditorTool.NONE && this.dragging) {
      const shape = ngEvent.event.target as Shape;
      shape.position({
        x: shape.x() + ngEvent.event.evt.movementX,
        y: shape.y() + ngEvent.event.evt.movementY,
      });
    }
  }

  onToolStageDragStart(ngEvent: NgKonvaEventObject<MouseEvent>): void {
    this.dragging = true;

    if (!ngEvent.event) {
      return;
    }

    if (ngEvent.event.target === this.stage().getStage()) {
      this.useTool();
    }
  }

  onToolStageDragEnd(ngEvent: NgKonvaEventObject<MouseEvent>): void {
    this.dragging = false;

    if (!ngEvent.event) {
      return;
    }
  }

  onToolStageDragMove(ngEvent: NgKonvaEventObject<MouseEvent>): void {
    if (!ngEvent.event) {
      return;
    }

    if (this.dragging) {
      if (ngEvent.event.target === this.stage().getStage()) {
        this.useTool();
      }
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

    const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
    const newRectConfig = {
      name: 'rect',
      x: gridXPos,
      y: gridYPos,
      width: this.gridBlockSize(),
      height: this.gridBlockSize(),
      fill: randomColor,
      stroke: '#fffff',
      strokeWidth: 1,
    } as RectConfig;

    // const newShadowRectConfig = {
    //   name: 'rect',
    //   x: newRectConfig.x,
    //   y: newRectConfig.y,
    //   width: newRectConfig.width,
    //   height: newRectConfig.height,
    //   fill: '#fffff',
    //   opacity: 0.6,
    // } as RectConfig;

    // newRect.on('dragstart', (event: KonvaEventObject<DragEvent>) => {
    //   this.bringToFront(event.target as Shape);
    // });
    // newRect.on('dragend', (event: KonvaEventObject<DragEvent>) => {
    //   this.snapToGrid(event.target as Shape);
    // });
    // newRect.on('dragmove', (_: KonvaEventObject<DragEvent>) => {
    //   newShadowRect.position({
    //     x: Math.round(newRect.x() / this.gridBlockSize()) * this.gridBlockSize(),
    //     y: Math.round(newRect.y() / this.gridBlockSize()) * this.gridBlockSize(),
    //   });
    // });

    this.shipElements.update((shipElements) => {
      shipElements[xGrid][yGrid] = new ShipElement(ShipElementType.HALLWAY, 100, undefined, [
        newRectConfig,
        // newShadowRectConfig,
      ]);
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
