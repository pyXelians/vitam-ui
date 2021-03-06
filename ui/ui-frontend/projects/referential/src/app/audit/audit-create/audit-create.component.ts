import {HttpHeaders} from '@angular/common/http';
import {Component, Inject, Input, OnInit} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {AccessContract, AccessionRegister, FilingPlanMode} from 'projects/vitamui-library/src/public-api';
import {Subscription} from 'rxjs';
import {ConfirmDialogService, StartupService} from 'ui-frontend-common';

import {AccessContractService} from '../../access-contract/access-contract.service';
import {AuditService} from '../audit.service';

const PROGRESS_BAR_MULTIPLICATOR = 100;


@Component({
  selector: 'app-audit-create',
  templateUrl: './audit-create.component.html',
  styleUrls: ['./audit-create.component.scss']
})
export class AuditCreateComponent implements OnInit {
  @Input() tenantIdentifier: number;

  FILLING_PLAN_MODE_INCLUDE = FilingPlanMode.INCLUDE_ONLY;

  form: FormGroup;
  stepIndex = 0;

  allServices = new FormControl(true);
  allNodes = new FormControl(true);
  selectedNodes = new FormControl();
  accessContractSelect = new FormControl(null, Validators.required);

  accessionRegisters: AccessionRegister[];
  accessContracts: AccessContract[];

  // stepCount is the total number of steps and is used to calculate the advancement of the progress bar.
  // We could get the number of steps using ViewChildren(StepComponent) but this triggers a
  // "Expression has changed after it was checked" error so we instead manually define the value.
  // Make sure to update this value whenever you add or remove a step from the  template.
  private stepCount = 1;
  private keyPressSubscription: Subscription;

  constructor(
    public dialogRef: MatDialogRef<AuditCreateComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private formBuilder: FormBuilder,
    private confirmDialogService: ConfirmDialogService,
    private auditService: AuditService,
    private startupService: StartupService,
    protected accessContractService: AccessContractService
  ) {
  }

  ngOnInit() {
    this.accessContractService.getAllForTenant('' + this.tenantIdentifier).subscribe((value) => {
      this.accessContracts = value;
    });

    this.form = this.formBuilder.group({
      auditActions: [null, Validators.required],
      auditType: ['tenant', Validators.required],
      objectId: [this.startupService.getTenantIdentifier(), Validators.required],
      query: [this.getRootQuery(null)]
    });

    this.accessContractSelect.valueChanges.subscribe(accessContractId => {
      console.log('AC ID: ', accessContractId);
      if (this.form.controls.auditActions.value === 'AUDIT_FILE_EXISTING' ||
        this.form.controls.auditActions.value === 'AUDIT_FILE_INTEGRITY') {
        console.log('Integrité / Existance');
        this.auditService.getAllAccessionRegister(accessContractId).subscribe(accessionRegisters => {
          console.log('Services Producteurs: ', accessionRegisters);
          this.accessionRegisters = accessionRegisters;
        });
      } else {
        console.log('Coherence');
        this.accessionRegisters = null;
      }
    });

    this.keyPressSubscription = this.confirmDialogService.listenToEscapeKeyPress(this.dialogRef).subscribe(() => this.onCancel());

    this.form.controls.auditActions.valueChanges.subscribe(action => {
      if (action === 'AUDIT_FILE_EXISTING' || action === 'AUDIT_FILE_INTEGRITY') {
        this.form.controls.auditType.setValue(this.allServices.value ? 'tenant' : 'originatingagency');
      } else {
        this.form.controls.auditType.setValue('dsl');
      }
    });

    this.allServices.valueChanges.subscribe((value) => {
      this.form.controls.auditType.setValue((value) ? 'tenant' : 'originatingagency');
      this.form.controls.objectId.setValue((value) ? this.startupService.getTenantIdentifier() : null);
    });

    this.selectedNodes.valueChanges.subscribe(value => {
      if (value && value.included && value.included.length > 0) {
        this.form.controls.query.setValue(this.getRootQuery(value.included));
      } else {
        this.form.controls.query.setValue(this.getRootQuery(null));
      }
      console.log('query: ', this.form.controls.query.value);
    });

    this.allNodes.valueChanges.subscribe((value) => this.stepCount = (value) ? 1 : 2);
  }

  isStepValid(): boolean {
    const isEvidenceAuditValid = this.form.value.auditActions === 'AUDIT_FILE_CONSISTENCY' &&
      !this.accessContractSelect.invalid && !this.accessContractSelect.pending;
    const isOtherAuditValid = (this.form.value.auditActions === 'AUDIT_FILE_INTEGRITY' ||
      this.form.value.auditActions === 'AUDIT_FILE_EXISTING') &&
      !this.accessContractSelect.invalid && !this.accessContractSelect.pending &&
      !this.form.get('auditType').invalid && !this.form.get('auditType').pending &&
      !this.form.get('objectId').invalid && !this.form.get('objectId').pending;
    return isEvidenceAuditValid || isOtherAuditValid;
  }

  ngOnDestroy = () => {
    this.keyPressSubscription.unsubscribe();
  }

  onCancel() {
    if (this.form.dirty) {
      this.confirmDialogService.confirmBeforeClosing(this.dialogRef);
    } else {
      this.dialogRef.close();
    }
  }

  onSubmit() {
    console.log('Form valid ? ', this.form.invalid);
    if (this.form.invalid) {
      return;
    }
    console.log('data: ', this.form.value);
    this.auditService.create(this.form.value, new HttpHeaders({'X-Access-Contract-Id': this.accessContractSelect.value})).subscribe(
      () => {
        this.dialogRef.close({success: true, action: 'none'});
      },
      (error: any) => {
        this.dialogRef.close({success: false, action: 'none'});
        console.error(error);
      });
  }

  get stepProgress() {
    return ((this.stepIndex + 1) / this.stepCount) * PROGRESS_BAR_MULTIPLICATOR;
  }

  getRootQuery(includedRoots: string[]) {
    if (includedRoots === null) {
      return {
        $query: [{
          $or: [{$exists: '#id'}]
        }],
        $filter: {},
        $projection: {}
      };
    }

    return {
      $query: [{
        $or: [{$in: {'#allunitups': includedRoots}}]
      }],
      $filter: {},
      $projection: {}
    };
  }

}
