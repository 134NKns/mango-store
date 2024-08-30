import { TestBed } from '@angular/core/testing';

import { PromtpayService } from './promtpay.service';

describe('PromtpayService', () => {
  let service: PromtpayService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PromtpayService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
