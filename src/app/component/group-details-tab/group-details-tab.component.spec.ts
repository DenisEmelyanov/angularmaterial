import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupDetailsTabComponent } from './group-details-tab.component';

describe('GroupDetailsTabComponent', () => {
  let component: GroupDetailsTabComponent;
  let fixture: ComponentFixture<GroupDetailsTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupDetailsTabComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GroupDetailsTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
