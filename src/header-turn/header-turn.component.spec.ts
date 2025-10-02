import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderTurnComponent } from './header-turn.component';

describe('HeaderTurnComponent', () => {
  let component: HeaderTurnComponent;
  let fixture: ComponentFixture<HeaderTurnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderTurnComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HeaderTurnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
