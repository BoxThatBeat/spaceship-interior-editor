import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShipEditorComponent } from './ship-editor.component';

describe('ShipEditorComponent', () => {
  let component: ShipEditorComponent;
  let fixture: ComponentFixture<ShipEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShipEditorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ShipEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
