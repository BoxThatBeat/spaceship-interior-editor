import { 
  Component,  
  forwardRef, 
  QueryList, 
  ViewChildren, 
  input, 
} from '@angular/core'; 
import { CoreShapeComponent } from 'ng2-konva'; 
import { ShipElementShape } from '../../models/ship-element-shape';
  
@Component({ 
  selector: 'ko-ship-element', 
  templateUrl: './ko-ship-element.component.html', 
  styleUrls: ['./ko-ship-element.component.scss'], 
  standalone: true,
  imports: [CoreShapeComponent],
  providers: [ 
    { 
      provide: CoreShapeComponent, 
      useExisting: forwardRef(() => KoShipElementComponent), 
    }, 
  ], 
}) 
export class KoShipElementComponent extends CoreShapeComponent { 
  @ViewChildren(CoreShapeComponent) 
  public override shapes: QueryList<CoreShapeComponent> = new QueryList<CoreShapeComponent>(); 

  
  shipElementShape = input.required<ShipElementShape>();



  // public configCircle: Observable<any> = of({ 
  //   x: 100, 
  //   y: 100, 
  //   radius: 70, 
  //   fill: 'black', 
  // }); 

  // public ngAfterViewInit(): void { 
  //   super.ngAfterContentInit(); 
  // } 

  //public ngAfterContentInit(): void {} 
} 
