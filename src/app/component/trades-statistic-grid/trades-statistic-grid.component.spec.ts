import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TradesStatisticGridComponent } from './trades-statistic-grid.component';

describe('TradesStatisticGridComponent', () => {
  let component: TradesStatisticGridComponent;
  let fixture: ComponentFixture<TradesStatisticGridComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TradesStatisticGridComponent]
    });
    fixture = TestBed.createComponent(TradesStatisticGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
