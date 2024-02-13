/**
Copyright (c) 1 2024, AJR
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
import {_applyFormat, _getCopy, _message} from "c/efUtils";

let dataArray;
let pivotConfiguration;

let context;
let headers;
let reportLines;
let rows;
let columns;
let values;

const setInitialData = (da, pc) => {
	dataArray = da;
	pivotConfiguration = pc;
};

const renderPivotTable = () => {
	try {
		if (!dataArray || !pivotConfiguration) return null;
		rows = pivotConfiguration.rows;
		columns = pivotConfiguration.columns;
		values = pivotConfiguration.values;
		getExampleTableHeader();
		const gropedData = groupData(dataArray);
		reportLines = generateReportLines(gropedData);
		calculateFormulaLines();
		applyFormat();
	} catch (e) {
		_message('error', 'Render Pivot Table Error ' + e);
	}
};

const group = {
	key: '',
	titles: [],
	lvl: 0,
	groups: [],
	dataLines: [],
	reportLines: [],
	groupTotalReportLine: {}
};
const getRecordKey = (rows, record) => rows.map(f => record[f]).join('');
const getNewGroup = () => _getCopy(group);

const getExampleTableHeader = () => {
	try {
		headers = [];
		if (rows) rows.forEach(r => headers.push(r.value));
		if (values) values.forEach(v => headers.push(v.label));
	} catch (e) {
		_message('error', 'Get Example Table Header Error : ' + e);
	}
};

const groupData = (dataArray) => {
	const lastLvl = rows.length; // 3
	const mainGroup = getNewGroup();

	const fillGroups = (dataLine, group, lvl) => {
		try {
			if (lvl === lastLvl) {
				group.dataLines.push(dataLine);
			} else {
				const rowValues = rows.map(r => r.value);
				const key = getRecordKey(rowValues.slice(0, lvl + 1), dataLine);
				let childGroup = group.groups.find(gr => gr.key === key);
				if (!childGroup) {
					childGroup = getNewGroup();
					childGroup.key = key;
					childGroup.lvl = lvl;
					childGroup.titles = [...group.titles, dataLine[rowValues[lvl]]];
					group.groups.push(childGroup);
				}
				fillGroups(dataLine, childGroup, lvl + 1);
			}
		} catch (e) {
			_message('error', 'Groups Error');
		}
	};

	dataArray.forEach(dataLine => {
		fillGroups(dataLine, mainGroup, 0)
	});
	//console.log(JSON.stringify(mainGroup));
	return mainGroup;
};

const reportLine = {
	titles: [],
	values: []
};

const getNewReportLine = (titles, dl) => {
	const newRL = _getCopy(reportLine);
	newRL.titles = titles;
	if (dl) {
		values.forEach(v => {
			let val = dl[v.value];
			if (!val) val = 0;
			newRL.values.push(val);
		});
	}
	return newRL;
};
const sumValues = (baseValues, newValues) => {
	for (let i = 0; i < newValues.length; i++) {
		let baseValue = baseValues[i];
		if (!baseValue) baseValue = 0;
		const newValue = newValues[i];
		baseValues[i] = +baseValue + +newValue;
	}
	return baseValues;
};

const generateReportLines = (gropedData) => {
	const reportLines = [];
	const populateListOfReportLinesAndReturnTotalValues = (group, lvl) => {
		try {
			let totalValues = [];
			group.groupTotalReportLine = getNewReportLine(group.titles);
			group.groupTotalReportLine.styleClass = `lvl${lvl}`;
			group.groupTotalReportLine.values = totalValues;
			if (group.groups.length > 0) {
				group.groups.forEach(childGroup => {
					let childTotalValues = populateListOfReportLinesAndReturnTotalValues(childGroup, lvl + 1);
					totalValues = sumValues(totalValues, childTotalValues);
				});
				reportLines.push(group.groupTotalReportLine);
			} else {
				group.dataLines.forEach(dl => {
					const simpleReportLine = getNewReportLine(group.titles, dl); // dl - data line
					totalValues = sumValues(totalValues, simpleReportLine.values);
					reportLines.push(simpleReportLine);
				});
			}
			return totalValues;
		} catch (e) {
			_message('error', 'Generate Report Lines Error : ' + e);
		}
	};
	populateListOfReportLinesAndReturnTotalValues(gropedData, 0);
	reportLines.forEach(rl => {
		try {
			if (!rl.styleClass) return null; // skip simple lines
			if (rl.titles.length === 0) {
				rl.titles = ['Global Total'];
			} else {
				rl.titles[rl.titles.length - 1] = 'Total ' + rl.titles[rl.titles.length - 1];
			}
			const diff = rows.length - rl.titles.length;
			//console.log('rl.titles DIF: ' + JSON.stringify(rl.titles) + ' - ' + diff);
			rl.titles = rl.titles.concat(Array(diff).fill('-'));
		} catch (e) {
			_message('error', 'RL Iteration Error : ' + e);
		}
	});
	//console.log('ReportLines : ' + JSON.stringify(reportLines));
	return reportLines;
};

const calculateFormulaLines = () => {
	try {
		const formulaSettings = pivotConfiguration.formulaValues;
		if (!formulaSettings) return null;
		const applyFormula = (formula) => {
			reportLines.forEach(rl => {
				try {
					const values = rl.values;
					let expression = formula;
					for (let i = 0; i < values.length; i++) {
						const placeholder = new RegExp(`#${i + 1}`, 'g');
						expression = expression.replace(placeholder, values[i]);
					}
					values.push(eval(expression));
				} catch (e) {
					_message('error', 'apply formula Error');
				}
			});
		};

		formulaSettings.forEach(fs => {
			headers.push(fs.label);
			applyFormula(fs.formula);
		});
	} catch (e) {
		_message('error', 'Calculate Formula Lines Error : ' + e);
	}
};

const applyFormat = () => {
	try {
		_applyFormat();
		let tableColumns = pivotConfiguration.values;
		if (pivotConfiguration.formulaValues) tableColumns = tableColumns.concat(pivotConfiguration.formulaValues);
		tableColumns.forEach((col, idx) => {
			const format = col.format;
			reportLines.forEach(rl => {
				const formattedValue = _applyFormat(rl.values[idx], format);
				rl.values[idx] = formattedValue;
			});
		});
	} catch (e) {
		_message('error', 'Apply Format Error : ' + e);
	}
};

const getResult = () => {
	return {headers, reportLines};
};

const getPivotTableObject = (da, pc) => {
	setInitialData(da, pc);
	renderPivotTable();
	return {headers, reportLines};
};


export {getPivotTableObject}