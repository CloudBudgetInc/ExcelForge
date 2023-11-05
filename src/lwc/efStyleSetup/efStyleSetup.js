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
import {api, LightningElement, track} from 'lwc';
import {_confirm, _message, _parseServerError} from "c/efUtils";
import getEFStyleByIdServer from '@salesforce/apex/EFStyleSelector.getEFStyleByIdServer';
import saveStyleServer from '@salesforce/apex/EFPageController.saveStyleServer';
import deleteStyleServer from '@salesforce/apex/EFPageController.deleteStyleServer';


export default class EFStyleSetup extends LightningElement {

	@api recordId; // style Id if exist
	@track showSpinner = false;
	@track style = {Name: 'New'};
	@track renderContent = false;

	async connectedCallback() {
		this.doInit();
	};

	doInit = async () => {
		try {
			this.renderContent = false;
			this.showSpinner = true;
			if (this.recordId) { // open existing record
				await this.getStyle();
			} else { // in case if new style needed
				this.style = {Name: 'New'};
			}
			this.renderContent = true;
			this.showSpinner = false;
		} catch (e) {
			_message('error', 'Style Setup Do Init Error: ' + e);
			this.showSpinner = false;
		}
	};

	getStyle = async () => this.style = await getEFStyleByIdServer({tId: this.recordId}).catch(e => _parseServerError('Get Style Error : ', e));

	/**
	 * @return {Promise<void>}
	 */
	saveStyle = async () => {
		this.recordId = await saveStyleServer({style: this.style}).catch(e => _parseServerError('Saving Style Error : ', e));
		this.style.Id = this.recordId;
	};

	deleteStyle = async () => {
		const confirmed = await _confirm('Are you sure to delete the style?', 'Confirm', 'warning');
		if (!confirmed) return null;
		this.showSpinner = true;
		await deleteStyleServer({cellId: this.cell.Id}).catch(e => _parseServerError('Delete Style Error : ', e));
		_message('success', 'Deleted');
		this.showSpinner = false;
	};

	handleChanges = (event) => {
		this.style[event.target.name] = event.target.value;
		this.saveStyle();
	};

	handleCheckbox = (event) => {
		this.style[event.target.name] = event.target.checked;
		this.saveStyle();
	}

}