/*
 * Copyright French Prime minister Office/SGMAP/DINSIC/Vitam Program (2019-2020)
 * and the signatories of the "VITAM - Accord du Contributeur" agreement.
 *
 * contact@programmevitam.fr
 *
 * This software is a computer program whose purpose is to implement
 * implement a digital archiving front-office system for the secure and
 * efficient high volumetry VITAM solution.
 *
 * This software is governed by the CeCILL-C license under French law and
 * abiding by the rules of distribution of free software.  You can  use,
 * modify and/ or redistribute the software under the terms of the CeCILL-C
 * license as circulated by CEA, CNRS and INRIA at the following URL
 * "http://www.cecill.info".
 *
 * As a counterpart to the access to the source code and  rights to copy,
 * modify and redistribute granted by the license, users are provided only
 * with a limited warranty  and the software's author,  the holder of the
 * economic rights,  and the successive licensors  have only  limited
 * liability.
 *
 * In this respect, the user's attention is drawn to the risks associated
 * with loading,  using,  modifying and/or developing or reproducing the
 * software by the user in light of its specific status of free software,
 * that may mean  that it is complicated to manipulate,  and  that  also
 * therefore means  that it is reserved for developers  and  experienced
 * professionals having in-depth computer knowledge. Users are therefore
 * encouraged to load and test the software's suitability as regards their
 * requirements in conditions enabling the security of their systems and/or
 * data to be ensured and,  more generally, to use and operate it in the
 * same conditions as regards security.
 *
 * The fact that you are presently reading this means that you have had
 * knowledge of the CeCILL-C license and that you accept its terms.
 */
import {HttpHeaders} from '@angular/common/http';
import {Component, Input, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {AccessContract, SearchUnitApiService} from 'projects/vitamui-library/src/public-api';
import {AccessContractService} from '../../access-contract.service';
import {AccessContractNodeUpdateComponent} from './access-contract-nodes-update/access-contract-node-update.component';

@Component({
  selector: 'app-access-contract-nodes-tab',
  templateUrl: './access-contract-nodes-tab.component.html',
  styleUrls: ['./access-contract-nodes-tab.component.scss']
})
export class AccessContractNodesTabComponent implements OnInit {

  @Input() accessContract: AccessContract;
  @Input() tenantIdentifier: number;

  titles: any = {};

  accessContracts: AccessContract[];
  searchAccessContractId: string;

  constructor(private dialog: MatDialog, private unitService: SearchUnitApiService, private accessContractService: AccessContractService) {
  }

  ngOnInit() {
    this.accessContractService.getAll().subscribe(accessContracts => this.accessContracts = accessContracts);
  }

  initTitles(event: any) {
    this.searchAccessContractId = event.value;
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
    const excludedRoots: string[] = this.accessContract.excludedRootUnits ? this.accessContract.excludedRootUnits : [];
    const rootUnits: string[] = this.accessContract.rootUnits ? this.accessContract.rootUnits : [];

    return {
      $roots: [],
      $query: [
        {
          $and: [
            {
              $in: {
                '#id': [...rootUnits, ...excludedRoots]
              }
            }
          ]
        }
      ],
      $projection: {
        $fields: {
          '#id': 1,
          Title: 1
        }
      }
    };
  }

  openUpdateSelectedNodes() {
    if (!this.searchAccessContractId) { return; }
    this.dialog.open(AccessContractNodeUpdateComponent, {
      panelClass: 'vitamui-modal',
      disableClose: true,
      data: {
        accessContract: this.accessContract,
        searchAccessContractId: this.searchAccessContractId,
        tenantIdentifier: this.tenantIdentifier
      }
    });
  }

  getTitle(id: string) {
    return this.titles[id] || id;
  }

  @Input()
  set readOnly(readOnly: boolean) {
    console.log(readOnly);
  }

}
