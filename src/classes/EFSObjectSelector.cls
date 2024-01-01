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


public with sharing class EFSObjectSelector {

	/**
	 * Method returns list of sObjects base on EFDataSet settings
	 *
	 * @param dsId
	 *
	 * @return
	 */
	@AuraEnabled
	public static List<sObject> getSObjectsByEFDataSetIdServer(String dsId) {
		EFDataSet__c dataSet = EFDataSetSelector.getEFDataSetByIdServer(dsId);
		Boolean isSingleMode = dataSet.exf__Type__c == 'Single';
		String s = 'SELECT ';
		String fields = dataSet.Fields__c;
		String f = ' FROM ' + dataSet.SourceType__c;
		String w;
		if (isSingleMode) {
			w = ' WHERE Id = \'' + dataSet.exf__SingleRecordId__c + '\' ';
		} else {
			w = String.isEmpty(dataSet.DataFilter__c) ? '' : ' WHERE ' + dataSet.DataFilter__c.replace('{id}', dataSet.exf__SingleRecordId__c);
		}
		String ob = '';
		if (dataSet.exf__PivotConfiguration__c != null) {
			try {
				Map<String, Object> jsonMap = (Map<String, Object>) JSON.deserializeUntyped(dataSet.exf__PivotConfiguration__c);
				System.debug(jsonMap.get('rows'));
				List<Map<String, String>> listOfMaps = (List<Map<String, String>>) jsonMap.get('rows');
				if (listOfMaps.size() > 0) {
					List<String> rowsList = new List<String>();
					for (Map<String, String> m : listOfMaps) rowsList.add(m.get('value'));
					ob = ' ORDER BY ' + String.join(rowsList, ',') + ' ';
				}
			} catch (Exception e) {
				System.debug('ERROR: ' + e);
			}
		}
		String l = isSingleMode ? ' LIMIT 1 ' : ' LIMIT 50000 ';
		String request = s + fields + f + w + ob + l;
		System.debug('REQUEST:' + request);
		return Database.query(request);
	}

}