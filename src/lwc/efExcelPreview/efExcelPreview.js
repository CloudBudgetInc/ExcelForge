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
import {LightningElement, track} from 'lwc';
import {_message, _parseServerError} from "c/efUtils";
import getEFTemplateByIdServer from '@salesforce/apex/EFTemplateSelector.getEFTemplateByIdServer';
import getEFDataSetsByEFTemplateIdServer from '@salesforce/apex/EFDataSetSelector.getEFDataSetsByEFTemplateIdServer';
import getAllEFSheetsByTemplateIdServer from '@salesforce/apex/EFSheetSelector.getAllEFSheetsByTemplateIdServer';
import getAllEFColumnsByTemplateIdServer from '@salesforce/apex/EFColumnSelector.getAllEFColumnsByTemplateIdServer';
import getAllEFRowsByTemplateIdServer from '@salesforce/apex/EFRowSelector.getAllEFRowsByTemplateIdServer';
import getAllEFCellsByTemplateIdServer from '@salesforce/apex/EFCellSelector.getAllEFCellsByTemplateIdServer';
import getAllEFStylesByTemplateIdServer from '@salesforce/apex/EFStyleSelector.getAllEFStylesByTemplateIdServer';
import getSObjectsByEFDataSetIdServer from '@salesforce/apex/EFSObjectSelector.getSObjectsByEFDataSetIdServer';

export default class EFExcelPreview extends LightningElement {

	@track testMessage = 'N/A';
	@track showSpinner = false;
	@track showTable = false;
	@track recordId = 'a060700000D913SAAR';

	@track template = {};
	@track dSets = [];
	@track sheets = [];
	@track columns = [];
	@track rows = [];
	@track cells = [];
	@track styles = [];

	@track sObjectsMap = {}; // key is dataSet Id, value is a list ov sObjects

	@track tableStructure = {};

	async connectedCallback() {
		this.doInit();
	};

	doInit = async () => {
		try {
			this.showTable = false;
			this.showSpinner = true;
			this.tableStructure = {};
			await this.getTemplate();
			console.log('template' + JSON.stringify(this.template));
			await this.getDataSets();
			console.log('dSets' + JSON.stringify(this.dSets));
			await this.getSheets();
			console.log('sheets' + JSON.stringify(this.sheets));
			await this.getColumns();
			console.log('columns' + JSON.stringify(this.columns));
			await this.getRows();
			console.log('rows' + JSON.stringify(this.rows));
			await this.getCells();
			console.log('cells' + JSON.stringify(this.cells));
			await this.getStyles();
			console.log('styles' + JSON.stringify(this.styles));

			await this.getSObjectMap();
			console.log('sObjectMap' + JSON.stringify(this.sObjectsMap));

			this.tableStructure = ['template', 'dSets', 'sheets', 'columns', 'rows', 'cells', 'styles'].reduce((r, f) => {
				r[f] = this[f];
				return r;
			}, {});
			console.log(JSON.stringify(this.tableStructure));
			this.showTable = true;
			this.showSpinner = false;
		} catch (e) {
			_message('error', 'DO Init Error: ' + e);
		}
	};

	getTemplate = async () => this.template = await getEFTemplateByIdServer({tId: this.recordId}).catch(e => _parseServerError('Get Template Error : ', e));
	getDataSets = async () => this.dSets = await getEFDataSetsByEFTemplateIdServer({tId: this.recordId}).catch(e => _parseServerError('Get Data Sets Error : ', e));
	getSheets = async () => this.sheets = await getAllEFSheetsByTemplateIdServer({tId: this.recordId}).catch(e => _parseServerError('Get Sheets Error : ', e));
	getColumns = async () => this.columns = await getAllEFColumnsByTemplateIdServer({tId: this.recordId}).catch(e => _parseServerError('Get Columns Error : ', e));
	getRows = async () => this.rows = await getAllEFRowsByTemplateIdServer({tId: this.recordId}).catch(e => _parseServerError('Get Rows Error : ', e));
	getCells = async () => this.cells = await getAllEFCellsByTemplateIdServer({tId: this.recordId}).catch(e => _parseServerError('Get Cells Error : ', e));
	getStyles = async () => this.styles = await getAllEFStylesByTemplateIdServer({tId: this.recordId}).catch(e => _parseServerError('Get Styles Error : ', e));

	getSObjectMap = async () => {
		for (let i = 0; i < this.dSets.length; i++) {
			await this.getSObjects(this.dSets[i].Id);
		}
	};

	getSObjects = async (dsId) => {
		await getSObjectsByEFDataSetIdServer({dsId})
			.then(sObjects => this.sObjectsMap[dsId] = sObjects)
			.catch(e => _parseServerError('Get sObjects Error : ' + e))
	};

	constructor() {
		super();
		this.addEventListener("doInit", this.doInit);
	}

}