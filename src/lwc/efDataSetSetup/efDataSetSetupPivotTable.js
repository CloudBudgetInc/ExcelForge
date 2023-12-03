/**
Copyright (c) 11 2023, AJR
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


//import {_getCopy, _message, _parseServerError} from "c/efUtils";
import {_getCopy, _message} from "c/efUtils";

let context;
let rows;
let columns;
let values;


const setTableContext = (_this) => context = _this;

const renderPivotExampleTable = () => {
	try {
		const dataArray = context.sObjects;
		const pivotConfiguration = context.dataSet.exf__PivotConfiguration__c;
		if (!dataArray || !pivotConfiguration) return null;
		rows = pivotConfiguration.rows;
		columns = pivotConfiguration.columns;
		values = pivotConfiguration.values;
		const gropedData = groupData(dataArray);
		context.reportLines = generateReportLines(gropedData);
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
	reportLines: []
};
const getRecordKey = (rows, record) => rows.map(f => record[f]).join('');
const getNewGroup = () => _getCopy(group);

const groupData = (dataArray) => {
	const lastLvl = rows.length; // 3
	const mainGroup = getNewGroup();

	const fillGroups = (dataLine, group, lvl) => {
		try {
			if (lvl === lastLvl) {
				group.dataLines.push(dataLine);
			} else {
				const key = getRecordKey(rows.slice(0, lvl + 1), dataLine);
				let childGroup = group.groups.find(gr => gr.key === key);
				if (!childGroup) {
					childGroup = getNewGroup();
					childGroup.key = key;
					childGroup.lvl = lvl;
					childGroup.titles = [...group.titles, dataLine[rows[lvl]]];
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
	console.log(JSON.stringify(mainGroup));
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
		values.forEach(valField => {
			let val = dl[valField];
			if (!val) val = 0;
			newRL.values.push(val);
		});
	}
	return newRL;
};

const generateReportLines = (gropedData) => {
	const reportLines = [];
	const processGroup = (group) => {
		try {
			const groupTotalReportLine = getNewReportLine(group.titles);
			if (group.groups.length > 0) {
				group.groups.forEach(childGroup => {
					processGroup(childGroup);
				});
				reportLines.push(groupTotalReportLine);
			} else {
				group.dataLines.forEach(dl => {
					const simpleReportLine = getNewReportLine(group.titles, dl);
					reportLines.push(simpleReportLine);
				});
			}
		} catch (e) {
			_message('error', 'Generate Report Lines Error : ' + e);
		}
	};
	processGroup(gropedData);
	console.log('ReportLines : ' + JSON.stringify(reportLines));
	return reportLines;
};


export {setTableContext, renderPivotExampleTable}


