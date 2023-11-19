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
import {_getCopy, _message, _parseServerError} from "c/efUtils";
import getEFDataSetByIdServer from '@salesforce/apex/EFDataSetSelector.getEFDataSetByIdServer';
import searchSObjectsServer from '@salesforce/apex/EFUtils.searchSObjectsServer';
import getFieldInfoServer from '@salesforce/apex/EFUtils.getFieldInfoServer';
import saveDataSetServer from '@salesforce/apex/EFPageController.saveDataSetServer';


export default class EFDataSetSetup extends LightningElement {

	@api recordId;
	@track showSpinner = false;
	@track renderScreen = false;
	@track dataSet = {};
	@track renderRules = {isSingle: true, isList: false, isPivot: false};


	async connectedCallback() {
		this.doInit();
	};

	doInit = async () => {
		try {
			this.showSpinner = true;
			await this.getDataSet();
			this.setRenderRule();
			this.showSpinner = false;
			this.renderScreen = true;
		} catch (e) {
			_message('error', 'Data Set Setup Do Init Error: ' + e);
			this.showSpinner = false;
		}
	};

	setRenderRule = () => {
		this.renderRules.isSingle = this.dataSet.exf__Type__c === 'Single';
		this.renderRules.isList = this.dataSet.exf__Type__c === 'List';
		this.renderRules.isPivot = this.dataSet.exf__Type__c === 'Pivot';
		this.renderRules = _getCopy(this.renderRules);
	};

	handleChanges = (event) => {
		this.dataSet[event.target.name] = event.target.value;
		this.setRenderRule();
	};

	getDataSet = async () => this.dataSet = await getEFDataSetByIdServer({tId: this.recordId}).catch(e => _parseServerError('Get Data Set Error : ', e));

	saveDataSet = () => {
		this.showSpinner = true;
		this.showEditSource = false;
		this.showListOfFields = false;
		saveDataSetServer({dataSet: this.dataSet})
			.then(dataSetId => {
				this.recordId = dataSetId;
				this.connectedCallback();
			})
			.catch(e => {
				this.showSpinner = false;
				_parseServerError('Save Data Set Error : ', e)
			})
	};

	//// SEARCH SOURCE FUNCTION ////
	@track showEditSource = false;
	@track searchSourceName = '-';
	@track searchingOptions = [];
	renderSearchSource = () => this.showEditSource = true;
	closeSearchSource = () => this.showEditSource = false;
	handleSearchString = (event) => this.searchSourceName = event.target.value;
	searchSource = async () => this.searchingOptions = await searchSObjectsServer({searchString: this.searchSourceName}).catch(e => _parseServerError('Search Source Error: ', e));
	applySearchedName = (event) => {
		this.dataSet.exf__SourceType__c = event.target.label;
		this.dataSet.exf__DataSetField__c = null;
		this.showEditSource = false;
	};
	//// SEARCH SOURCE FUNCTION ////

	//// FIELDS PANEL ////
	@track showListOfFields = false;
	@track listOfAvailableFields = [];
	renderListOfFields = () => {
		this.showListOfFields = true;
		this.getListOfAvailableFields();
	};
	closeListOfFields = () => this.showListOfFields = false;
	getListOfAvailableFields = async () => {
		const fieldsMap = await getFieldInfoServer({sObjectName: this.dataSet.exf__SourceType__c}).catch(e => _parseServerError('Get List of Fields Error: ', e));
		if (fieldsMap) {
			const checkedFields = this.dataSet.exf__Fields__c ? this.dataSet.exf__Fields__c.split(',') : [];
			const labels = Object.keys(fieldsMap).sort();
			this.listOfAvailableFields = labels.reduce((r, item) => {
				const checked = checkedFields.find(checkedField => checkedField.toLowerCase().includes(item.toLowerCase()));
				r.push({label: item, checked: !!checked});
				return r;
			}, []);
		}
	};
	handleFieldChange = (event) => {
		const checked = event.target.checked;
		const field = event.target.label;
		const so = this.listOfAvailableFields.find(so => so.label === field);
		so.checked = checked;
		const fieldsArray = this.listOfAvailableFields.reduce((r, item) => {
			if (item.checked) r.push(item.label);
			return r;
		}, []);
		fieldsArray.sort();
		this.dataSet.exf__Fields__c = fieldsArray.join(',');
	}
	//// FIELDS PANEL ////


}