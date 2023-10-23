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
import {generateTable, generateTabs, setContext} from "./efExcelStructure";
import {_getCopy, _message} from "c/efUtils";

export default class EFExcelTable extends LightningElement {

	@api tableStructure = {};
	@api sObjectsMap = {};

	@track showSpinner = false;
	@track template = {};
	@track sheets = [];
	@track columns = [];
	@track rows = [];
	@track cells = [];
	@track styles = [];
	/// TABLE
	@track letterHeaders = [];
	@track allSheets = [];
	@track openedSheet;
	@track selectedColumnId;

	@track tabs = [];

	@track readyToRender = false;
	@track showSheetSetupDialog = false;
	@track showColumnSetupDialog = false;

	connectedCallback() {
		this.readyToRender = false;
		this.showSpinner = true;
		this.template = this.tableStructure.template;
		this.sheets = this.tableStructure.sheets;
		this.columns = this.tableStructure.columns;
		this.rows = this.tableStructure.rows;
		this.cells = this.tableStructure.cells;
		this.styles = this.tableStructure.styles;
		const prepareData = () => {
			setContext(this);
			generateTabs();
			generateTable();
			this.readyToRender = true;
			this.showSpinner = false;
		};
		setTimeout(prepareData, 100);
	};

	/**
	 * User selected another sheet
	 */
	changeSheet = (event) => {
		const selectedSheetId = event.target.value;
		this.openedSheet = this.allSheets.find(sheet => sheet.Id === selectedSheetId);
		this.openedSheet = _getCopy(this.openedSheet);
		this.tabs.forEach(tab => tab.class = tab.value === selectedSheetId ? 'selectedButton' : '');
		this.tabs = _getCopy(this.tabs);
	};

	showSheetSetup = (event) => {
		try {
			if (event.target.value) {
				this.changeSheet(event);
			} else {
				this.openedSheet.Id = null;
			}
			this.showSheetSetupDialog = true;
		} catch (e) {
			_message('error', 'Show Sheet Setup Error : ' + e);
		}
	};

	showColumnSetup = (event) => {
		try {
			this.selectedColumnId = event.currentTarget.dataset.colid;
			if (!this.selectedColumnId) this.selectedColumnId = event.currentTarget.dataset.idx;
			this.showColumnSetupDialog = true;
		} catch (e) {
			_message('error', 'Show Column Setup Error : ' + e);
		}
	};

	closeSheetSetup = () => {
		this.showSheetSetupDialog = false;
		this.reloadAllData();
	};

	closeColumnSetup = () => {
		this.showColumnSetupDialog = false;
		this.reloadAllData();
	};

	reloadAllData = () => {
		this.dispatchEvent(new CustomEvent('doInit', {
			bubbles: true,
			composed: true,
			detail: '_'
		}));
	};

	constructor() {
		super();
		this.addEventListener("closeSheetSetup", this.closeSheetSetup);
		this.addEventListener("closeColumnSetup", this.closeColumnSetup);
	}

}