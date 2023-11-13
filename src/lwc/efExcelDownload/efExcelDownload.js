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
import {_message, _prompt, _setCell} from "c/efUtils";
import exceljs from "@salesforce/resourceUrl/exceljs";
import {loadScript} from "lightning/platformResourceLoader";


export default class EFExcelDownload extends LightningElement {

	@api sheets;
	@track showLoader = false;

	renderedCallback() {
		if (this.librariesLoaded) return;
		this.librariesLoaded = true;
		Promise.all([loadScript(this, exceljs)]).catch(function (e) {
			_message(`error`, `BLME : Excel Backup load library ${e}`);
		});
	}

	async connectedCallback() {
		this.doInit();
	};

	downloadExcelFile = async () => {
		try {

			this.showSpinner = true;
			let fileName = `Template`;
			fileName = await _prompt("Type the file name", fileName, 'File Name');
			if (!fileName || fileName.length < 1) {
				this.showSpinner = false;
				return;
			}
			let workbook = new ExcelJS.Workbook();

			console.log('SHEETS : ' + JSON.stringify(this.sheets));
			this.sheets.forEach(dataSheet => {
				console.log('SHEET : ' + JSON.stringify(dataSheet));
				let excelSheet = workbook.addWorksheet(dataSheet.name, {
					views: [{
						state: "frozen",
						ySplit: 0,
						xSplit: 0
					}]
				});
				this.populateSheet(dataSheet, excelSheet);
				this.setColumns(dataSheet.letterHeaders, excelSheet);
			});

			let data = await workbook.xlsx.writeBuffer();
			const blob = new Blob([data], {type: "application/octet-stream"});
			let downloadLink = document.createElement("a");
			downloadLink.href = window.URL.createObjectURL(blob);
			downloadLink.target = "_blank";
			downloadLink.download = fileName + ".xlsx";
			downloadLink.click();
			this.showSpinner = false;
		} catch (e) {
			_message("error", "Reporting Excel generateExcelFile error: " + e);
			this.showSpinner = false;
		}
	};

	populateSheet = (dataSheet, excelSheet) => {
		try {
			let rowCounter = 1;
			let cellCounter = 1;
			dataSheet.rows.forEach(dataRow => {
				const excelRow = excelSheet.getRow(rowCounter++);
				cellCounter = 0;
				dataRow.cells.forEach(dataCell => {
					cellCounter++;
					if (!dataCell.cellId) return null;
					const excelCell = excelRow.getCell(cellCounter); //(cell, value, fill, font, numFmt, alignment, border)
					const excelStyleMap = this.convertCSSToExcelStyle(dataCell.style);
					_setCell(excelCell, dataCell.value, excelStyleMap?.fill, excelStyleMap?.font);
				})
			})
		} catch (e) {
			_message('error', 'Populate Sheet Error : ' + e);
		}
	};

	setColumns = (letterHeaders, excelSheet) => {
		try {
			if (!letterHeaders || letterHeaders.length === 0) return null;
			letterHeaders.forEach((h, i) => {
				if (i === 0) return null;
				const column = excelSheet.getColumn(i);
				column.width = h.s ? h.s?.replace(/\D/g, '') / 9 : 15;
				console.log('column.width = ' + column.width);
			});
		} catch (e) {
			_message('error', 'Set columns error : ' + e);
		}
	};

	convertCSSToExcelStyle = (cssStyle) => {
		const r = {};
		if (!cssStyle || cssStyle.length === 0) return r;
		console.log('cssStyle = ' + cssStyle);
		/**
		 * height: 100%;
		 * width: 100%;
		 * color: #BA4848;
		 * background-color: #b5e853;
		 * font-size: 16px;
		 * text-decoration: underline;
		 * font-style: italic;
		 * font-weight: bold;
		 * text-align:center;
		 * border-top: 1px solid #CA2E79;
		 * border-bottom: 1px solid #CA2E79;
		 * border-right: 1px solid #CA2E79;
		 * border-left: 1px solid #CA2E79;
		 */
		try {
			const propertyMapping = cssStyle.split(';').reduce((m, property) => {
				if (!property || !property.includes(':')) return m;
				const keyVal = property.split(':');
				m[keyVal[0].trim()] = keyVal[1].trim();
				return m;
			}, {});
			console.log('propertyMapping = ' + JSON.stringify(propertyMapping));
			const backGroundColor = propertyMapping['background-color'];
			if (backGroundColor) r.fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: {argb: backGroundColor.replace('#', '')}
			};

			const fontSize = propertyMapping['font-size'];
			const isBold = propertyMapping['font-weight'];
			if (fontSize || isBold) {
				r.font = {
					size: fontSize ? fontSize : 12,
					bold: isBold === true
				};
			}
			console.log('RESULT: ' + JSON.stringify(r));
			return r;
		} catch (e) {
			_message('error', 'Convert Styles Error: ' + e);
		}
	};
	/*const HEADER_FONT = {
		size: 11,
		bold: true,
		name: 'Calibri',
	};*/


}