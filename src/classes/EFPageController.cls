/** 
Copyright (c) 2023, ExcelForge.
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


public with sharing class EFPageController {

	@AuraEnabled
	public static String saveSheetServer(EFSheet__c sheet) {
		upsert sheet;
		return sheet.Id;
	}

	@AuraEnabled
	public static void deleteSheetServer(String sheetId) {
		delete [SELECT Id FROM EFCell__c WHERE EFRow__r.EFSheet__c = :sheetId];
		delete [SELECT Id FROM EFRow__c WHERE EFSheet__c = :sheetId];
		delete [SELECT Id FROM EFColumn__c WHERE EFSheet__c = :sheetId];
		Database.delete(sheetId);
	}

	@AuraEnabled
	public static String cloneSheetServer(EFSheet__c sheet) {
		System.debug('SHEET: ' + sheet);
		sheet.Name = 'Cloned ' + sheet.Name;
		sheet.Id = null;
		insert sheet;

		List<EFColumn__c> columns = new List<EFColumn__c>();
		List<EFCell__c> cells = new List<EFCell__c>();
		List<EFRow__c> newRows = new List<EFRow__c>();
		for (EFColumn__c col : EFColumnSelector.getAllEFColumnsByTemplateIdServer(sheet.EFTemplate__c)) prepareToClone(col, columns, sheet.Id);
		for (EFRow__c row : EFRowSelector.getAllEFRowsByTemplateIdServer(sheet.EFTemplate__c)) prepareToClone(row, newRows, sheet.Id);
		insert columns;
		insert newRows;

		return sheet.Id;
	}

	private static void prepareToClone(sObject obj, List<sObject> arr, Id sheetId) {
		obj = obj.clone(false, true, false, false);
		obj.put('exf__EFSheet__c', sheetId);
		obj.Id = null;
		arr.add(obj);
	}

	@AuraEnabled
	public static String saveColumnServer(EFColumn__c column) {
		System.debug('COL: ' + column);
		upsert column;
		return column.Id;
	}

	@AuraEnabled
	public static void deleteColumnServer(String columnId) {
		Database.delete(columnId);
	}

	@AuraEnabled
	public static String saveCellServer(EFCell__c cell, String sheetId, Integer rowIdx, Integer colIdx) {
		List<EFRow__c> rows = EFRowSelector.getEFRowsByFilterServer('EFSheet__c = \'' + sheetId + '\' AND Index__c = ' + rowIdx);
		EFRow__c row;
		if (rows.size() > 0) {
			row = rows[0]; // row was created before
		} else {
			row = new EFRow__c(EFSheet__c = sheetId, Index__c = rowIdx);
			insert row;
		}
		cell.EFRow__c = row.Id;
		cell.Index__c = colIdx;
		upsert cell;
		return cell.Id;
	}

	@AuraEnabled
	public static void deleteCellServer(String cellId) {
		Database.delete(cellId);
	}

	@AuraEnabled
	public static String saveStyleServer(EFStyle__c style) {
		upsert style;
		return style.Id;
	}

	@AuraEnabled
	public static void deleteStyleServer(String styleId) {
		Database.delete(styleId);
	}

	@AuraEnabled
	public static String saveDataSetServer(EFDataSet__c dataSet) {
		upsert dataSet;
		return dataSet.Id;
	}
}