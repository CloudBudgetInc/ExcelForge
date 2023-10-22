/** 
Copyright (c) 2022, CloudBudget, Inc.
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


public with sharing class EFStyleSelector {

	@AuraEnabled
	public static EFStyle__c getEFStyleByIdServer(String tId) {
		return [
				SELECT
						AlignmentHorizontal__c,
						AlignmentVertical__c,
						BorderBottom__c,
						BorderColor__c,
						BorderLeft__c,
						BorderRight__c,
						BorderTop__c,
						FillColor__c,
						FillPatern__c,
						FontBold__c,
						FontColor__c,
						FontItalic__c,
						FontSize__c,
						FontUnderline__c,
						Id,
						Name
				FROM EFStyle__c
				WHERE Id = :tId
		];
	}

	@AuraEnabled
	public static List<EFStyle__c> getAllEFStylesByTemplateIdServer(String tId) {
		Set<Id> styleIds = new Set<Id>();
		for (EFCell__c cell : EFCellSelector.getAllEFCellsByTemplateIdServer(tId)) {
			System.debug('cell.EFStyle__c = ' + cell.EFStyle__c);
			if (cell.EFStyle__c != null) styleIds.add(cell.EFStyle__c);
		}
		for (EFRow__c row : EFRowSelector.getAllEFRowsByTemplateIdServer(tId)) {
			if (row.EFStyle__c != null) styleIds.add(row.EFStyle__c);
		}
		System.debug('styleIds = ' + styleIds);
		return [
				SELECT AlignmentHorizontal__c,
						AlignmentVertical__c,
						BorderBottom__c,
						BorderColor__c,
						BorderLeft__c,
						BorderRight__c,
						BorderTop__c,
						FillColor__c,
						FillPatern__c,
						FontBold__c,
						FontColor__c,
						FontItalic__c,
						FontSize__c,
						FontUnderline__c,
						Id,
						Name
				FROM EFStyle__c
				WHERE Id IN:styleIds
				LIMIT 5000
		];
	}
}