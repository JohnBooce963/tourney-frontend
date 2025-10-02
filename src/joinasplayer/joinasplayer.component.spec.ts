import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JoinAsPlayerComponent } from './joinasplayer.component';

describe('PopupComponent', () => {
  let component: JoinAsPlayerComponent;
  let fixture: ComponentFixture<JoinAsPlayerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JoinAsPlayerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(JoinAsPlayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
