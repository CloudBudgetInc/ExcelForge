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
import getEFSheetByIdServer from '@salesforce/apex/EFSheetSelector.getEFSheetByIdServer';
import saveSheetServer from '@salesforce/apex/EFPageController.saveSheetServer';
import deleteSheetServer from '@salesforce/apex/EFPageController.deleteSheetServer';
import cloneSheetServer from '@salesforce/apex/EFPageController.cloneSheetServer';


export default class EFSheetSetup extends LightningElement {

	@api recordId;
	@api templateId;
	@track showSpinner = false;
	@track sheet = {};
	@track reloadMainComponent = false;

	async connectedCallback() {
		this.doInit();
	};

	doInit = async () => {
		try {
			this.showSpinner = true;
			if (this.recordId) { // open existing record
				await this.getSheet();
			} else { // in case if new sheet needed
				this.sheet = {Name: 'New', exf__XSplit__c: 0, exf__YSplit__c: 0};
			}
			if (this.templateId) this.sheet.exf__EFTemplate__c = this.templateId;
			this.showSpinner = false;
		} catch (e) {
			_message('error', 'Sheet Setup Do Init Error: ' + e);
		}
	};

	getSheet = async () => this.sheet = await getEFSheetByIdServer({tId: this.recordId}).catch(e => _parseServerError('Get Sheet Error : ', e));

	saveSheet = async () => {
		this.showSpinner = true;
		this.recordId = await saveSheetServer({sheet: this.sheet}).catch(e => _parseServerError('Saving Sheet Error : ', e));
		await this.getSheet();
		_message('success', 'Saved');
		this.showSpinner = false;
		this.reloadMainComponent = true;
	};

	deleteSheet = async () => {
		const confirmed = await _confirm('Are you sure to delete the sheet?', 'Confirm', 'warning');
		if (!confirmed) return null;
		this.showSpinner = true;
		await deleteSheetServer({sheetId: this.sheet.Id}).catch(e => _parseServerError('Delete Sheet Error : ', e));
		_message('success', 'Deleted');
		this.showSpinner = false;
		this.closeSheetSetup();
		this.reloadMainComponent = true;
	};

	cloneSheet = async () => {
		const sheet = this.sheet;
		const confirmed = await _confirm('Are you sure to clone the sheet?', 'Confirm', 'warning');
		if (!confirmed) return null;
		this.showSpinner = true;
		this.recordId = await cloneSheetServer({sheet}).catch(e => _parseServerError('Cloning Sheet Error : ', e));
		await this.getSheet();
		_message('success', 'Cloned');
		this.showSpinner = false;
		this.reloadMainComponent = true;
	};

	handleChanges = (event) => this.sheet[event.target.name] = event.target.value;

	closeSheetSetup = () => {
		this.dispatchEvent(new CustomEvent('closeSetupDialog', {
			bubbles: true,
			composed: true,
			detail: {reloadMainComponent: this.reloadMainComponent}
		}));
	};

}