import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CloudExplorerComponent } from './cloud-explorer.component';

describe('CloudExplorerComponent', () => {
  let component: CloudExplorerComponent;
  let fixture: ComponentFixture<CloudExplorerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CloudExplorerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CloudExplorerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
