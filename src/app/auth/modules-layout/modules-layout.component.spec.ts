import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModulesLayoutComponent } from './modules-layout.component';

describe('ModulesLayoutComponent', () => {
  let component: ModulesLayoutComponent;
  let fixture: ComponentFixture<ModulesLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModulesLayoutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModulesLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
