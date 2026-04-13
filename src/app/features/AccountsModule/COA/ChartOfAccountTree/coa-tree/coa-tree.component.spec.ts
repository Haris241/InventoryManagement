import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoaTreeComponent } from './coa-tree.component';

describe('CoaTreeComponent', () => {
  let component: CoaTreeComponent;
  let fixture: ComponentFixture<CoaTreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoaTreeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CoaTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
