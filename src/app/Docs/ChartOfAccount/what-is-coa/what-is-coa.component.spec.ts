import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WhatIsCoaComponent } from './what-is-coa.component';

describe('WhatIsCoaComponent', () => {
  let component: WhatIsCoaComponent;
  let fixture: ComponentFixture<WhatIsCoaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WhatIsCoaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WhatIsCoaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
