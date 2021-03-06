/* tslint:disable:object-literal-key-quotes quotemark */
import {HttpHeaders} from '@angular/common/http';
import {Component, Input, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {AccessContract, IngestContract, SearchUnitApiService} from 'projects/vitamui-library/src/public-api';

import {AccessContractService} from '../../../access-contract/access-contract.service';
import {IngestContractNodeUpdateComponent} from './ingest-contract-nodes-update/ingest-contract-node-update.component';


@Component({
  selector: 'app-ingest-contract-attachment-tab',
  templateUrl: './ingest-contract-attachment-tab.component.html',
  styleUrls: ['./ingest-contract-attachment-tab.component.scss']
})
export class IngestContractAttachmentTabComponent implements OnInit {

  submited = false;

  @Input()
  tenantIdentifier: number;

  accessContractId: string;

  accessContracts: AccessContract[];
  titles: any = {};

  // tslint:disable-next-line:variable-name
  private _ingestContract: IngestContract;

  previousValue = (): IngestContract => {
    return this._ingestContract;
  }

  @Input()
  set ingestContract(ingestContract: IngestContract) {
    this._ingestContract = ingestContract;
  }

  get ingestContract(): IngestContract {
    return this._ingestContract;
  }

  @Input()
  set readOnly(readOnly: boolean) {
    console.log('RO:', readOnly);
  }

  constructor(
    private dialog: MatDialog,
    private accessContractService: AccessContractService,
    private unitService: SearchUnitApiService) {
  }

  ngOnInit() {
    this.accessContractService.getAll().subscribe(accessContracts => this.accessContracts = accessContracts);
  }

  initTitles(event: any) {
    this.accessContractId = event.value;
    let headers = new HttpHeaders().append('Content-Type', 'application/json');
    headers = headers.append('X-Access-Contract-Id', event.value);
    this.unitService.getByDsl(this.getDslForRootNodes(), headers).subscribe(
      response => {
        if (response.httpCode === 200) {
          this.titles = {};
          response.$results.forEach((result: any) => {
            this.titles[result['#id']] = result.Title;
          });
        }

      }
    );
  }

  getDslForRootNodes(): any {
    const linkParentIdAsLinst: string[] = this.ingestContract.linkParentId ? [this.ingestContract.linkParentId] : [];
    const checkParentId: string[] = this.ingestContract.checkParentId ? this.ingestContract.checkParentId : [];

    return {
      "$roots": [],
      "$query": [
        {
          "$and": [
            {
              "$in": {
                "#id": [...checkParentId, ...linkParentIdAsLinst]
              }
            }
          ]
        }
      ],
      "$projection": {
        "$fields": {
          "#id": 1,
          "Title": 1
        }
      }
    };
  }

  openUpdateSelectedNodes() {
    if (!this.accessContractId) {
      return;
    }
    this.dialog.open(IngestContractNodeUpdateComponent, {
      panelClass: 'vitamui-modal',
      disableClose: true,
      data: {
        ingestContract: this.ingestContract,
        accessContractId: this.accessContractId,
        tenantIdentifier: this.tenantIdentifier
      }
    });
  }

  getTitle(id: string) {
    return this.titles[id] || id;
  }
}
