import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountlayoutComponent } from './accountlayout.component';

describe('AccountlayoutComponent', () => {
  let component: AccountlayoutComponent;
  let fixture: ComponentFixture<AccountlayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountlayoutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccountlayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
