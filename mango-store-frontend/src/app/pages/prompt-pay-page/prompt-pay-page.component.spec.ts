import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PromptPayPageComponent } from './prompt-pay-page.component';

describe('PromptPayPageComponent', () => {
  let component: PromptPayPageComponent;
  let fixture: ComponentFixture<PromptPayPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PromptPayPageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PromptPayPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
