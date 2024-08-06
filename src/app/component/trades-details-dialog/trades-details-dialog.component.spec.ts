import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TradesDetailsDialogComponent } from './trades-details-dialog.component';

describe('TradesDetailsDialogComponent', () => {
  let component: TradesDetailsDialogComponent;
  let fixture: ComponentFixture<TradesDetailsDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TradesDetailsDialogComponent]
    });
    fixture = TestBed.createComponent(TradesDetailsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
