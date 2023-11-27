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

let context;

const setContext = (_this) => context = _this;

const renderTable = () => {
	const dataArray = context.sObjects;
	const pivotConfiguration = context.dataSet.exf__PivotConfiguration__c;
	if (!dataArray || !pivotConfiguration) return null;

};

const groupData = (rows, columns, dataArray) => {
	const lastLvl = rows.length; // 3

	const firstF = rows[0];
	const mainGroup = getNewGroup();

	dataArray.forEach(line => {
		fillGroups(line, mainGroup, 0)
	});

	const fillGroups = (line, group, lvl) => {
		if (lvl === lastLvl) {
			group.lines.push(line);
		} else {
			const key = getRecordKey(rows.slice(0, lvl + 1), line);
			let childGroup = group.groups.find(gr => gr.key === key);
			if (!childGroup) {
				childGroup = getNewGroup();
				childGroup.key = key;
				group.groups.push(childGroup);
			}
			fillGroups(line, childGroup, lvl + 1);
		}
	};


};

const getRecordKey = (rows, record) => rows.map(f => record[f]).join('');
const getNewGroup = () => Object.assign({}, group);
const getNewLine = () => Object.assign({}, line);

const group = {
	key: '',
	groups: [],
	lines: [],
	totalLine: getNewLine()
};

const line = {
	k1: null, // key 1
	k2: null,
	k3: null,
	k4: null,
	k5: null,
	c1: null, // column 1 value
	c2: null,
	c3: null,
	c4: null,
	c5: null,
	c6: null,
	c7: null
};


export {setContext}


