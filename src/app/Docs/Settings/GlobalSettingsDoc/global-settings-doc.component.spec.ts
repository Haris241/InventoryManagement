import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GlobalSettingsDocComponent } from './global-settings-doc.component';

describe('GlobalSettingsDocComponent', () => {
  let component: GlobalSettingsDocComponent;
  let fixture: ComponentFixture<GlobalSettingsDocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GlobalSettingsDocComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GlobalSettingsDocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
