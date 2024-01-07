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
import getSingleRecordsServer from '@salesforce/apex/EFUtils.getSingleRecordsServer';
import getFieldInfoServer from '@salesforce/apex/EFUtils.getFieldInfoServer';
import saveDataSetServer from '@salesforce/apex/EFPageController.saveDataSetServer';
import getSObjectsByEFDataSetIdServer from '@salesforce/apex/EFSObjectSelector.getSObjectsByEFDataSetIdServer';
import {
	backFieldToStart,
	dragFieldOver,
	dragFieldStart,
	dropFieldToArray,
	getPivotSetupFields,
	setContext
} from "./efDataSetSetupPivotConfiguration";
import {renderPivotExampleTable, setTableContext} from "./efDataSetSetupPivotTable";


export default class EFDataSetSetup extends LightningElement {

	@api recordId;
	@track showSpinner = false;
	@track renderScreen = false;
	@track dataSet = {};
	@track renderRules = {isSingle: true, isPivot: false};
	@track sObjects = [];
	////// PIVOT TABLE /////
	@track sObjectFields = [];
	@track sObjectRowFields = [];
	@track headers = [];
	@track reportLines = [];
	@track formatSO = [
		{label: 'general', value: 'general'},
		{label: 'number', value: 'number'},
		{label: 'percent', value: 'percent'},
		{label: 'currency', value: 'currency'}
	];

	////// PIVOT TABLE /////


	async connectedCallback() {
		this.doInit();
	};

	doInit = async () => {
		try {
			this.showSpinner = true;
			await this.getDataSet();
			this.setRenderRule();
			await this.getSObjects();
			if (this.dataSet.exf__Type__c === 'Pivot') {
				setContext(this);
				getPivotSetupFields(this);
				setTableContext(this);
				renderPivotExampleTable();
			}
			this.showSpinner = false;
			this.renderScreen = true;
		} catch (e) {
			_message('error', 'Data Set Setup Do Init Error: ' + e);
			this.showSpinner = false;
		}
	};

	setRenderRule = () => {
		try {
			this.renderRules.isSingle = this.dataSet.exf__Type__c === 'Single';
			this.renderRules.isPivot = this.dataSet.exf__Type__c === 'Pivot';
			this.renderRules = _getCopy(this.renderRules);
		} catch (e) {
			_message('error', 'Set Render Rule Error: ' + e);
		}
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
		if (this.dataSet.exf__PivotConfiguration__c) this.dataSet.exf__PivotConfiguration__c = JSON.stringify(this.dataSet.exf__PivotConfiguration__c);
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
	};
	closeListOfFields = () => this.showListOfFields = false;
	getListOfAvailableFields = async () => {
		const fieldsMap = await getFieldInfoServer({sObjectName: this.dataSet.exf__SourceType__c}).catch(e => _parseServerError('Get List of Fields Error: ', e));
		alert('FM:' + JSON.stringify(fieldsMap));
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
	};
	//// FIELDS PANEL ////

	//// SEARCH SINGLE RECORD FUNCTIONS ////
	@track showEditSingleRecord = false;
	@track searchSingleRecordName = '-';
	@track singleRecordOptions = [];
	renderEditSingleRecord = () => this.showEditSingleRecord = true;
	closeEditSingleRecord = () => this.showEditSingleRecord = false;
	handleSingleRecordSearchString = (event) => this.searchSingleRecordName = event.target.value;
	searchSingleRecords = async () => {
		const params = {sObjectName: this.dataSet.exf__SourceType__c, searchString: this.searchSingleRecordName};
		this.singleRecordOptions = await getSingleRecordsServer(params)
			.catch(e => _parseServerError('Search Single Record Error: ', e));
		this.singleRecordOptions = Object.keys(this.singleRecordOptions).reduce((r, name) => {
			const id = this.singleRecordOptions[name];
			r.push({name, id});
			return r;
		}, []);
	};
	applySingleRecordName = (event) => {
		this.dataSet.exf__SingleRecordId__c = event.target.value;
		this.showEditSingleRecord = false;
	};
	//// SEARCH SINGLE RECORD FUNCTIONS ////

	//// GET RECORDS ///
	@track singleRecordExampleTable;
	getSObjects = async () => {
		try {
			this.singleRecordExampleTable = undefined;
			this.sObjects = await getSObjectsByEFDataSetIdServer({dsId: this.recordId}).catch(e => console.error('GET SOBJECT ERROR: ' + e));
			console.log('SObjects:' + JSON.stringify(this.sObjects));
			//this.sObjects.forEach(o => console.log(JSON.stringify(o)));
			if (!this.sObjects || this.sObjects.length === 0) return null;
			if (this.dataSet.exf__Type__c === 'Single') {
				const record = this.sObjects[0];
				this.singleRecordExampleTable = Object.keys(record).reduce((r, header) => {
					let value = record[header];
					if (value && value.length > 50) value = value.slice(0, 50) + '...';
					r.push({header, value});
					return r;
				}, []);
			}
		} catch (e) {
			_message('error', 'Get SObjects Error : ' + e);
		}
	};
	//// GET RECORDS ///

	///// PIVOT CONFIGURATION /////
	dragStart = (event) => dragFieldStart(event);
	dragOver = (event) => dragFieldOver(event);
	dropToRows = (event) => dropFieldToArray(event, 'rows');
	dropToColumns = (event) => dropFieldToArray(event, 'columns');
	dropToValues = (event) => dropFieldToArray(event, 'values');
	removeField = (event) => backFieldToStart(event.target.label);
	///// PIVOT CONFIGURATION /////

	/////  VALUE SETUP /////
	@track renderValueDialog = false;
	@track openedValueIndex = 0;
	@track openedValue = {};
	showValueDialog = (event) => {
		let idx = event?.target.name;
		this.openedValueIndex = idx;
		this.openedValue =  this.dataSet.exf__PivotConfiguration__c.values[idx];
		this.renderValueDialog = true;
	};
	handleValueSetup = (event) => {
		this.openedValue[event.target.name] = event.target.value;
	};
	closeValueDialog = () => {
		this.renderValueDialog = false;
	};
	applyValueDialog = () => {
		this.dataSet.exf__PivotConfiguration__c.values[this.openedValueIndex] = this.openedValue;
		_message('Applied');
		this.closeValueDialog();
		this.saveDataSet();
	};
	/////  VALUE SETUP /////

	///// FORMULA FIELD DIALOG /////
	@track renderFormulaValueDialog = false;
	@track openedFormulaValue;
	@track openedFormulaIndex;
	/**
	 * Handler opens dialog to setup formula value
	 */
	showFormulaValueDialog = (event) => {
		let idx = event?.target.name;
		this.renderFormulaValueDialog = true;
		let formulaValues = this.dataSet.exf__PivotConfiguration__c.formulaValues;
		if (!formulaValues) { // initialization
			idx = 0;
			formulaValues = [{formula: '#1 + #2', label: 'F1', format: 'general'}];
			this.dataSet.exf__PivotConfiguration__c.formulaValues = formulaValues;
		}
		if (idx === undefined) {
			idx = formulaValues.length;
			formulaValues.push({formula: '#1 + #2', label: 'F1', format: 'general'});
		}
		this.openedFormulaIndex = idx;
		this.openedFormulaValue = formulaValues[idx];
	};
	closeFormulaValueDialog = () => {
		this.renderFormulaValueDialog = false;
	};
	handleFormulaValue = (event) => {
		this.openedFormulaValue[event.target.name] = event.target.value;
	};
	applyFormulaValueDialog = () => {
		this.dataSet.exf__PivotConfiguration__c.formulaValues[this.openedFormulaIndex] = this.openedFormulaValue;
		_message('Applied');
		this.closeFormulaValueDialog();
		this.saveDataSet();
	};
	removeFormulaValue = (event) => {
		let formulaValues = this.dataSet.exf__PivotConfiguration__c.formulaValues;
		formulaValues = formulaValues.filter((item, i) => i !== event.target.name);
		this.dataSet.exf__PivotConfiguration__c.formulaValues = formulaValues;
		this.saveDataSet();
	}
	///// FORMULA FIELD DIALOG /////


}