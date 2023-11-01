/**
Copyright (c) 10 2023, AJR
All rights reserved.
Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:
 * Redistributions of source code must retain the above copyright notice,
this list of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice,
this list of conditions and the following disclaimer in the documentation
and/or other materials provided with the distribution.
 * Neither the name of the CloudBudget, Inc. nor the names of its contributors
may be used to endorse or promote products derived from this software
without specific prior written permission.
THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE
OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED
OF THE POSSIBILITY OF SUCH DAMAGE.

 */
import {api, LightningElement, track} from 'lwc';
import {_confirm, _message, _parseServerError} from "c/efUtils";
import getEFCellByIdServer from '@salesforce/apex/EFCellSelector.getEFCellByIdServer';
import getEFCellByCoordinateServer from '@salesforce/apex/EFCellSelector.getEFCellByCoordinateServer';
import saveCellServer from '@salesforce/apex/EFPageController.saveCellServer';
import deleteCellServer from '@salesforce/apex/EFPageController.deleteCellServer';


export default class EFCellSetup extends LightningElement {

	@api recordId; // cell Id if exist		
	@api cellCoordinate; // '5,7'
	@api sheetId;
	@track showSpinner = false;
	@track cell = {Name: 'Test'};
	@track renderContent = false;
	@track rowIdx;
	@track colIdx;
	@track reloadMainComponent = false;


	async connectedCallback() {
		this.doInit();
	};

	doInit = async () => {
		try {
			if (this.cellCoordinate) {
				this.rowIdx = this.cellCoordinate.split(',')[0];
				this.colIdx = this.cellCoordinate.split(',')[1];
			}
			this.renderContent = false;
			this.showSpinner = true;
			if (this.recordId) { // open existing record
				await this.getCell();
				this.rowIdx = this.cell.exf__EFRowIndex__c;
				this.colIdx = this.cell.exf__Index__c;
				this.sheetId = this.cell.exf__EFSheet__c;
			} else { // in case if new column needed
				await this.getCellByCoordinate();
			}
			if (!this.cell) {
				this.cell = {Name: 'New'};
			}
			this.renderContent = true;
			this.showSpinner = false;
		} catch (e) {
			_message('error', 'Cell Setup Do Init Error: ' + e);
			this.showSpinner = false;
		}
	};

	getCell = async () => this.cell = await getEFCellByIdServer({tId: this.recordId}).catch(e => _parseServerError('Get Cell Error : ', e));
	getCellByCoordinate = async () => this.cell = await getEFCellByCoordinateServer({
		rowIdx: this.rowIdx,
		colIdx: this.colIdx,
		sheetId: this.sheetId
	}).catch(e => _parseServerError('Get Cell by Coordinate Error : ', e));

	/**
	 * (EFCell__c cell, String sheetId, Integer rowIdx, Integer colIdx
	 * @return {Promise<void>}
	 */
	saveCell = async () => {
		this.renderContent = false;
		this.showSpinner = true;
		this.recordId = await saveCellServer({
			cell: this.cell,
			sheetId: this.sheetId,
			rowIdx: this.rowIdx,
			colIdx: this.colIdx
		}).catch(e => _parseServerError('Saving Cell Error : ', e));
		await this.getCell();
		_message('success', 'Saved');
		this.showSpinner = false;
		this.renderContent = true;
		this.reloadMainComponent = true;
	};

	deleteCell = async () => {
		const confirmed = await _confirm('Are you sure to delete the cell?', 'Confirm', 'warning');
		if (!confirmed) return null;
		this.showSpinner = true;
		await deleteCellServer({cellId: this.cell.Id}).catch(e => _parseServerError('Delete Cell Error : ', e));
		_message('success', 'Deleted');
		this.showSpinner = false;
		this.reloadMainComponent = true;
		this.closeCellSetup();
	};

	handleChanges = (event) => this.cell[event.target.name] = event.target.value;

	closeCellSetup = () => {
		this.dispatchEvent(new CustomEvent('closeSetupDialog', {
			bubbles: true,
			composed: true,
			detail: {reloadMainComponent: this.reloadMainComponent}
		}));
	};

}