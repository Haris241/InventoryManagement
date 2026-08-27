import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductGuideComponent } from './product-guide.component';

describe('ProductGuideComponent', () => {
  let component: ProductGuideComponent;
  let fixture: ComponentFixture<ProductGuideComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductGuideComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductGuideComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
