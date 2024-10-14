import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BannerManagementPageComponent } from './banner-management-page.component';

describe('BannerManagementPageComponent', () => {
  let component: BannerManagementPageComponent;
  let fixture: ComponentFixture<BannerManagementPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BannerManagementPageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BannerManagementPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
