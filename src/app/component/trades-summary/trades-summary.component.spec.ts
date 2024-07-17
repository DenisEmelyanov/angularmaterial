import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TradesSummaryComponent } from './trades-summary.component';

describe('TradesSummaryComponent', () => {
  let component: TradesSummaryComponent;
  let fixture: ComponentFixture<TradesSummaryComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TradesSummaryComponent]
    });
    fixture = TestBed.createComponent(TradesSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
