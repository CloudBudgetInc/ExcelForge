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


public with sharing class EFUtils {

	private static List<String> SKIP_FIELDS = new List<String>{
			'isdeleted', 'lastmodifieddate', 'systemmodstamp', 'lastvieweddate', 'lastreferenceddate', 'lastmodifiedbyid'
	};

	@AuraEnabled
	public static Map<String, String> getFieldInfoServer(String sObjectName) {
		Map<String, String> fieldInfoMap = new Map<String, String>();
		SObjectType sObjectType = Schema.getGlobalDescribe().get(sObjectName);
		if (sObjectType != null) {
			Map<String, SObjectField> fieldMap = sObjectType.getDescribe().fields.getMap();
			for (String key : fieldMap.keySet()) {
				if (SKIP_FIELDS.contains(key)) continue;
				String fieldName = fieldMap.get(key).getDescribe().getName();
				Schema.DisplayType fieldType = fieldMap.get(key).getDescribe().getType();
				String fieldTypeString = convertDisplayTypeToString(fieldType);
				fieldInfoMap.put(fieldName, fieldTypeString);
			}
		}
		return fieldInfoMap;
	}

	@AuraEnabled
	public static List<String> searchSObjectsServer(String searchString) {
		List<String> matchingSObjects = new List<String>();
		if (searchString == null || searchString.length() < 3) return matchingSObjects;
		Map<String, Schema.SObjectType> schemaMap = Schema.getGlobalDescribe();
		List<Schema.SObjectType> allSObjectNames = schemaMap.values();
		for (Schema.SObjectType sObjectName : allSObjectNames) {
			String name = sObjectName.getDescribe().getName();
			if (matchingSObjects.size() >= 5) break;
			if (name.toLowerCase().contains('__share') || name.toLowerCase().contains('__changeevent')) continue;
			if (name.toLowerCase().contains(searchString.toLowerCase())) matchingSObjects.add(name);
		}
		return matchingSObjects;
	}

	@AuraEnabled
	public static Map<String, String> getSingleRecordsServer(String sObjectName, String searchString) {
		Map<String, String> recordOptions = new Map<String, String>();
		for (sObject rec : Database.query('SELECT Id, Name FROM ' + sObjectName + ' WHERE Name LIKE \'%' + searchString + '%\' ORDER BY Name LIMIT 20')) {
			recordOptions.put((String) rec.get('Name'), rec.Id);
		}
		return recordOptions;
	}

	private static String convertDisplayTypeToString(Schema.DisplayType displayType) {
		switch on displayType {
			when STRING, ID, ADDRESS, LOCATION, ANYTYPE, PHONE, EMAIL, PICKLIST, CURRENCY {
				return 'STRING';
			}
			when BOOLEAN {
				return 'BOOLEAN';
			}
			when DATE {
				return 'DATE';
			}
			when DATETIME {
				return 'DATETIME';
			}
			when DOUBLE {
				return 'DOUBLE';
			}
			when INTEGER {
				return 'INTEGER';
			}
			when PERCENT {
				return 'PERCENT';
			}
			when TIME {
				return 'TIME';
			}
			when URL {
				return 'URL';
			}
			when COMBOBOX {
				return 'COMBOBOX';
			}
			when REFERENCE {
				return 'REFERENCE';
			}
			when COMPLEXVALUE {
				return 'COMPLEXVALUE';
			}
		}
		return 'STRING';
	}

}