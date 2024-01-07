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
import {_message} from "c/efUtils";

let context;

const setContext = (_this) => context = _this;

const getPivotSetupFields = () => {
	try {
		if (!context.dataSet || !context.sObjects || context.length === 0) {
			_message('warning', 'Select data to make start setting a pivot table');
			return null;
		}
		if (!context.dataSet.exf__PivotConfiguration__c) context.dataSet.exf__PivotConfiguration__c = '{"rows":[],"columns":[],"values":[]}';
		if (typeof context.dataSet.exf__PivotConfiguration__c === 'string') {
			context.dataSet.exf__PivotConfiguration__c = JSON.parse(context.dataSet.exf__PivotConfiguration__c);
		}
		context.sObjectFields = [];
		const rowsAndValues = [...context.dataSet.exf__PivotConfiguration__c.rows, ...context.dataSet.exf__PivotConfiguration__c.values];
		const rowValues = rowsAndValues.map(r => r.value);
		Object.keys(context.sObjects[0]).forEach(key => {
			if (rowValues.includes(key)) return null;
			context.sObjectFields.push(key);
		});
	} catch (e) {
		_message('error', 'Get Pivot Setup Fields Error : ' + e);
	}
};


const backFieldToStart = (field) => {
	['rows', 'columns', 'values'].forEach(type => {
		context.dataSet.exf__PivotConfiguration__c[type] = context.dataSet.exf__PivotConfiguration__c[type].filter(obj => obj.value !== field);
	});
	context.sObjectFields.push(field);
};

////// DRAG AND DROP /////
const dragFieldStart = (event) => {
	try {
		event.target.classList.add('drag');
	} catch (e) {
		_message('error', 'Drag Error : ' + e);
	}
};

const dragFieldOver = (event) => {
	event.preventDefault();
	return false;
};

const dropFieldToArray = (event, arrName) => {
	try {
		event.stopPropagation();
		const draggedField = context.template.querySelector('.drag').textContent;
		context.dataSet.exf__PivotConfiguration__c[arrName].push({value: draggedField, format: 'general'});
		context.sObjectFields = context.sObjectFields.filter(f => f !== draggedField);
		context.template.querySelectorAll('.draggableLine').forEach(element => element.classList.remove('drag'));
	} catch (e) {
		_message('error', 'Drop Error : ' + e);
	}
};
////// DRAG AND DROP /////


export {setContext, getPivotSetupFields, dragFieldStart, dragFieldOver, dropFieldToArray, backFieldToStart}


