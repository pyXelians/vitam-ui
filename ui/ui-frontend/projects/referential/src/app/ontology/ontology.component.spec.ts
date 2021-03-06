import {Component, Input, NO_ERRORS_SCHEMA} from '@angular/core';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {MatDialogModule, MatSidenavModule} from '@angular/material';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {RouterTestingModule} from '@angular/router/testing';
import {InjectorModule, LoggerModule} from 'ui-frontend-common';
import {VitamUICommonTestModule} from 'ui-frontend-common/testing';

import {OntologyComponent} from './ontology.component';

@Component({selector: 'app-ontology-preview', template: ''})
// tslint:disable-next-line:component-class-suffix
class OntologyPreviewStub {
  @Input()
  accessContract: any;
}

@Component({selector: 'app-ontology-list', template: ''})
// tslint:disable-next-line:component-class-suffix
class OntologyListStub {
}

describe('OntologyComponent', () => {
  let component: OntologyComponent;
  let fixture: ComponentFixture<OntologyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        OntologyComponent,
        OntologyListStub,
        OntologyPreviewStub
      ],
      imports: [
        VitamUICommonTestModule,
        RouterTestingModule,
        InjectorModule,
        LoggerModule.forRoot(),
        NoopAnimationsModule,
        MatSidenavModule,
        MatDialogModule
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OntologyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
