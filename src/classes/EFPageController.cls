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
		Database.delete(sheetId);
	}

	@AuraEnabled
	public static String cloneSheetServer(EFSheet__c sheet) {
		sheet.Name = 'Cloned ' + sheet.Name;
		sheet.Id = null;
		insert sheet;
		return sheet.Id;
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

}