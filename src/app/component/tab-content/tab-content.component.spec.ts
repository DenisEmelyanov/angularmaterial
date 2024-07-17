import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TabContentComponent } from './tab-content.component';

describe('TabGridComponent', () => {
  let component: TabContentComponent;
  let fixture: ComponentFixture<TabContentComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TabContentComponent]
    });
    fixture = TestBed.createComponent(TabContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
