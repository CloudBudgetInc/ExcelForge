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
import getEFColumnByIdServer from '@salesforce/apex/EFColumnSelector.getEFColumnByIdServer';
import saveColumnServer from '@salesforce/apex/EFPageController.saveColumnServer';
import deleteColumnServer from '@salesforce/apex/EFPageController.deleteColumnServer';


export default class EFColumnSetup extends LightningElement {

	@api recordId;
	@api sheetId;
	@track showSpinner = false;
	@track column = {};

	async connectedCallback() {
		this.doInit();
	};

	doInit = async () => {
		try {
			this.showSpinner = true;
			if (this.recordId.length > 3) { // open existing record
				await this.getColumn();
			} else { // in case if new column needed
				this.column = {Name: 'New', exf__Width__c: 120, exf__Index__c: this.recordId};
			}
			if (this.sheetId) this.column.exf__EFSheet__c = this.sheetId;
			this.showSpinner = false;
		} catch (e) {
			_message('error', 'Column Setup Do Init Error: ' + e);
		}
	};

	getColumn = async () => this.column = await getEFColumnByIdServer({tId: this.recordId}).catch(e => _parseServerError('Get Column Error : ', e));

	saveColumn = async () => {
		this.showSpinner = true;
		this.recordId = await saveColumnServer({column: this.column}).catch(e => _parseServerError('Saving Column Error : ', e));
		await this.getColumn();
		_message('success', 'Saved');
		this.showSpinner = false;
	};

	deleteColumn = async () => {
		const confirmed = await _confirm('Are you sure to delete the column?', 'Confirm', 'warning');
		if (!confirmed) return null;
		this.showSpinner = true;
		await deleteColumnServer({columnId: this.column.Id}).catch(e => _parseServerError('Delete Column Error : ', e));
		_message('success', 'Deleted');
		this.showSpinner = false;
		this.closeColumnSetup();
	};

	handleChanges = (event) => this.column[event.target.name] = event.target.value;

	closeColumnSetup = () => {
		this.dispatchEvent(new CustomEvent('closeColumnSetup', {
			bubbles: true,
			composed: true,
			detail: '_'
		}));
	};

}